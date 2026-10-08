<?php

namespace Tests\Feature;

use App\Enums\Environment;
use App\Models\ActivityLog;
use App\Models\Crop;
use App\Models\Farm;
use App\Models\Reading;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\CropSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Token expiry, farm-wide history, threshold snapshots, the next-watering estimate,
 * the activity log, CSV import, and command-line password recovery.
 */
class ExtrasTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $superAdmin;

    private Farm $farm;

    private Zone $zone;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CropSeeder::class);

        $this->superAdmin = User::factory()->superAdmin()->create(['name' => 'Boss']);
        $this->admin = User::factory()->create(['name' => 'Ana Reyes']);
        $this->farm = Farm::create(['name' => 'Rooftop Garden']);
        $this->farm->users()->attach($this->admin);
        $this->zone = $this->makeZone('Bed A');

        Sanctum::actingAs($this->admin);
    }

    private function makeZone(string $name, ?Farm $farm = null): Zone
    {
        // Pechay: soil 60-80.
        return ($farm ?? $this->farm)->zones()->create([
            'crop_id' => Crop::where('name', 'Pechay')->value('id'),
            'name' => $name,
            'environment' => Environment::Rooftop,
            'water_factor' => 0.5,
        ]);
    }

    private function enter(Zone $zone, float $soilMoisture, Carbon $at): int
    {
        return $this->postJson("/api/zones/{$zone->id}/readings", [
            'soil_moisture' => $soilMoisture,
            'temperature' => 25,
            'humidity' => 70,
            'recorded_at' => $at->toIso8601String(),
        ])->assertCreated()->json('reading.id');
    }

    private function csv(string $content): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('readings.csv', $content);
    }

    public function test_a_login_expires_after_seven_days(): void
    {
        $token = $this->admin->createToken('web')->plainTextToken;
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->getJson('/api/me')->assertOk();

        $this->travel(8)->days();
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
    }

    public function test_farm_history_lists_all_zones_and_filters_by_zone(): void
    {
        $bedB = $this->makeZone('Bed B');
        $elsewhere = $this->makeZone('Not this farm', Farm::create(['name' => 'Other']));

        $this->enter($this->zone, 45, now()->subDays(2));
        $this->enter($bedB, 70, now()->subDay());
        Sanctum::actingAs($this->superAdmin);
        $this->enter($elsewhere, 70, now()->subDay());

        $this->getJson("/api/farms/{$this->farm->id}/readings")->assertOk()
            ->assertJsonCount(2, 'readings')
            ->assertJsonPath('readings.0.zone.name', 'Bed B')
            ->assertJsonPath('readings.1.zone.name', 'Bed A');

        $this->getJson("/api/farms/{$this->farm->id}/readings?zone_id={$bedB->id}")->assertOk()->assertJsonCount(1, 'readings');
        $this->getJson("/api/farms/{$this->farm->id}/readings?status=too_dry")->assertOk()->assertJsonCount(1, 'readings');
        // A zone of another farm is not a valid filter here.
        $this->getJson("/api/farms/{$this->farm->id}/readings?zone_id={$elsewhere->id}")->assertStatus(422);

        Sanctum::actingAs($this->admin);
        $this->getJson("/api/farms/{$elsewhere->farm_id}/readings")->assertForbidden();
    }

    public function test_each_reading_keeps_the_ranges_it_was_judged_against(): void
    {
        $this->enter($this->zone, 55, now()->subDays(2));

        $this->zone->crop->update(['soil_moisture_min' => 40, 'soil_moisture_max' => 60]);

        $this->enter($this->zone, 55, now()->subDay());

        $this->getJson("/api/zones/{$this->zone->id}/trend")->assertOk()
            ->assertJsonPath('points.0.moisture_status', 'too_dry')
            ->assertJsonPath('points.0.thresholds.soil_moisture_min', 60)
            ->assertJsonPath('points.1.moisture_status', 'optimal')
            ->assertJsonPath('points.1.thresholds.soil_moisture_min', 40)
            ->assertJsonPath('points.1.thresholds.crop', 'Pechay');
    }

    public function test_zone_and_dashboard_include_the_next_watering_estimate(): void
    {
        $this->getJson("/api/zones/{$this->zone->id}")->assertOk()->assertJsonPath('zone.watering_estimate.state', 'no_data');

        // Losing 4 points a day; 72 now and a minimum of 60, so about 3 days left.
        $this->enter($this->zone, 80, now()->subDays(2));
        $this->enter($this->zone, 76, now()->subDays(1));
        $id = $this->enter($this->zone, 72, now()->subMinute());

        foreach (["/api/zones/{$this->zone->id}" => 'zone', '/api/dashboard' => 'zones.0', "/api/readings/{$id}" => 'reading.zone'] as $url => $path) {
            $estimate = $this->getJson($url)->assertOk()->json("{$path}.watering_estimate");

            $this->assertSame('estimated', $estimate['state'], $url);
            $this->assertEqualsWithDelta(4.0, $estimate['drying_rate_per_day'], 0.1, $url);
            $this->assertEqualsWithDelta(3.0, now()->diffInHours($estimate['due_at']) / 24, 0.1, $url);
        }
    }

    public function test_activity_log_records_who_changed_what(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $crop = Crop::where('name', 'Basil')->first();
        $payload = [
            'name' => 'Basil',
            'soil_moisture_min' => 45, 'soil_moisture_max' => 70,
            'temp_min' => 20, 'temp_max' => 30,
            'humidity_min' => 40, 'humidity_max' => 60,
        ];

        $this->putJson("/api/super-admin/crops/{$crop->id}", $payload)->assertOk();
        // Saving again without changing anything adds no entry.
        $this->putJson("/api/super-admin/crops/{$crop->id}", $payload)->assertOk();

        $this->patchJson("/api/super-admin/admins/{$this->admin->id}/active", ['is_active' => false])->assertOk();
        $this->postJson("/api/super-admin/admins/{$this->admin->id}/reset-password")->assertOk();
        $this->putJson("/api/super-admin/farms/{$this->farm->id}", ['name' => 'Rooftop Garden', 'admin_ids' => []])->assertOk();

        $id = $this->enter($this->zone, 70, now()->subHour());
        $this->putJson("/api/readings/{$id}", ['water_applied_liters' => 3])->assertOk();
        $this->deleteJson("/api/readings/{$id}")->assertOk();

        $response = $this->getJson('/api/super-admin/activity')->assertOk();

        $this->assertSame(
            ['reading.deleted', 'reading.updated', 'farm.updated', 'account.password_reset', 'account.deactivated', 'crop.updated'],
            array_column($response->json('entries'), 'action'),
        );

        $cropEntry = $response->json('entries.5');
        $this->assertSame('Boss', $cropEntry['user']['name']);
        $this->assertSame('Edited the crop Basil', $cropEntry['description']);
        $this->assertEquals(50, $cropEntry['changes']['before']['soil_moisture_min']);
        $this->assertEquals(45, $cropEntry['changes']['after']['soil_moisture_min']);
        $this->assertArrayNotHasKey('temp_min', $cropEntry['changes']['after']);

        $this->assertSame([$this->admin->id], $response->json('entries.2.changes.admins_removed'));

        // Passwords never reach the log.
        $this->assertStringNotContainsString('password":', json_encode(ActivityLog::pluck('changes')));

        $this->getJson('/api/super-admin/activity?area=reading')->assertOk()->assertJsonCount(2, 'entries');

        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/super-admin/activity')->assertForbidden();
    }

    public function test_csv_import_saves_every_row_and_flags_unusual_ones(): void
    {
        Carbon::setTestNow('2026-10-08 12:00:00');

        $file = $this->csv(implode("\n", [
            "\xEF\xBB\xBFRecorded_At, soil_moisture,temperature,humidity,water_applied_liters,notes",
            '2026-10-06 07:30,45,25,70,12,"dry, watered"',
            '',
            '2026-10-07 07:30,70,48,70,,',
        ]));

        $this->post("/api/zones/{$this->zone->id}/readings/import", ['file' => $file, 'timezone' => 'Asia/Manila'], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJson(['imported' => 2, 'flagged' => 1]);

        $first = Reading::orderBy('recorded_at')->first();

        // 07:30 in Manila is 23:30 UTC the day before.
        $this->assertSame('2026-10-05 23:30:00', $first->recorded_at->toDateTimeString());
        $this->assertSame('too_dry', $first->moisture_status->value);
        $this->assertSame(12.5, $first->recommended_liters);
        $this->assertSame(12.0, $first->water_applied_liters);
        $this->assertSame('dry, watered', $first->notes);
        $this->assertSame('csv', $first->source->value);
        $this->assertSame($this->admin->id, $first->entered_by);
        $this->assertEquals(60, $first->thresholds['soil_moisture_min']);

        $second = Reading::orderByDesc('recorded_at')->first();
        $this->assertTrue($second->is_suspicious);
        $this->assertNull($second->water_applied_liters);

        $this->assertSame('reading.imported', ActivityLog::latest('id')->value('action'));
    }

    public function test_csv_import_is_all_or_nothing_and_reports_each_bad_row(): void
    {
        Carbon::setTestNow('2026-10-08 12:00:00');
        $this->enter($this->zone, 70, Carbon::parse('2026-10-05 07:30', 'Asia/Manila'));

        $file = $this->csv(implode("\n", [
            'recorded_at,soil_moisture,temperature,humidity',
            '2026-10-06 07:30,45,25,70',
            '2026-10-06 07:30,50,25,70',
            '2026-10-07 07:30,140,25,',
            'yesterday-ish,45,25,70',
            '2026-10-05 07:30,45,25,70',
            '2026-12-25 07:30,45,25,70',
        ]));

        $response = $this->post("/api/zones/{$this->zone->id}/readings/import", ['file' => $file, 'timezone' => 'Asia/Manila'], ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonPath('code', 'import_failed')
            ->assertJsonPath('row_error_count', 5);

        $errors = collect($response->json('row_errors'))->pluck('errors', 'line');

        $this->assertSame(['Same time as line 2.'], $errors[3]);
        $this->assertCount(2, $errors[4]);
        $this->assertStringContainsString('not a date', $errors[5][0]);
        $this->assertSame(['This zone already has a reading at this time.'], $errors[6]);
        $this->assertSame(['The reading time cannot be in the future.'], $errors[7]);

        // Line 2 was fine, but nothing is saved when any row fails.
        $this->assertSame(1, Reading::count());
    }

    public function test_csv_import_rejects_unusable_files_and_other_farms(): void
    {
        $import = fn (Zone $zone, string $content) => $this->post(
            "/api/zones/{$zone->id}/readings/import", ['file' => $this->csv($content)], ['Accept' => 'application/json'],
        );

        $import($this->zone, "when,soil_moisture,temperature,humidity\n2026-10-06,45,25,70")
            ->assertStatus(422)->assertJsonPath('message', 'The first line must name the columns. Missing: recorded_at.');
        $import($this->zone, 'recorded_at,soil_moisture,temperature,humidity')
            ->assertStatus(422)->assertJsonPath('message', 'The file has column names but no readings.');

        $import($this->makeZone('Elsewhere', Farm::create(['name' => 'Other'])), "recorded_at,soil_moisture,temperature,humidity\n2026-10-06,45,25,70")
            ->assertForbidden();

        $this->zone->update(['is_active' => false]);
        $import($this->zone, "recorded_at,soil_moisture,temperature,humidity\n2026-10-06,45,25,70")->assertStatus(422);

        $this->assertSame(0, Reading::count());
    }

    public function test_reset_password_command_recovers_a_locked_out_super_admin(): void
    {
        $this->superAdmin->update(['is_active' => false]);
        $this->superAdmin->createToken('web');

        $this->artisan('sibol:reset-password', ['email' => 'nobody@sibol.test'])->assertFailed();
        $this->artisan('sibol:reset-password', ['email' => $this->superAdmin->email])->assertSuccessful();

        $this->superAdmin->refresh();

        $this->assertTrue($this->superAdmin->is_active);
        $this->assertTrue($this->superAdmin->must_change_password);
        $this->assertSame(0, $this->superAdmin->tokens()->count());
        // The old password no longer works.
        $this->postJson('/api/login', ['email' => $this->superAdmin->email, 'password' => 'password'])->assertStatus(422);
    }
}
