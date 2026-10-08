<?php

namespace Tests\Feature;

use App\Enums\Environment;
use App\Models\Crop;
use App\Models\Farm;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\CropSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Farm $farm;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CropSeeder::class);

        $this->admin = User::factory()->create(['name' => 'Ana Reyes']);
        $this->farm = Farm::create(['name' => 'Rooftop Garden']);
        $this->farm->users()->attach($this->admin);

        Sanctum::actingAs($this->admin);
    }

    private function zone(string $name, ?Farm $farm = null): Zone
    {
        // Pechay: soil 60-80, so the target is 70. Water factor 0.5.
        return ($farm ?? $this->farm)->zones()->create([
            'crop_id' => Crop::where('name', 'Pechay')->value('id'),
            'name' => $name,
            'environment' => Environment::Rooftop,
            'water_factor' => 0.5,
        ]);
    }

    private function enter(Zone $zone, float $soilMoisture, Carbon $at, ?float $applied = null, ?string $notes = null): void
    {
        $this->postJson("/api/zones/{$zone->id}/readings", [
            'soil_moisture' => $soilMoisture,
            'temperature' => 25,
            'humidity' => 70,
            'recorded_at' => $at->toIso8601String(),
            'water_applied_liters' => $applied,
            'notes' => $notes,
            'confirm_suspicious' => true,
        ])->assertCreated();
    }

    public function test_water_report_compares_recommended_and_applied_per_zone(): void
    {
        $bedA = $this->zone('Bed A');
        $bedB = $this->zone('Bed B');
        $this->zone('Bed C, no readings');

        // Bed A: 50% -> 10 L recommended, 12 applied. 40% -> 15 L recommended, 10 applied.
        $this->enter($bedA, 50, now()->subDays(3), applied: 12);
        $this->enter($bedA, 40, now()->subDays(2), applied: 10);
        // Not recorded: its 5 L recommendation must not count against the applied total.
        $this->enter($bedA, 60 - 0.5, now()->subDays(1));
        // Bed B: optimal, nothing recommended, but 2 L applied anyway.
        $this->enter($bedB, 70, now()->subDays(1), applied: 2);
        // Outside the default 30-day range.
        $this->enter($bedB, 40, now()->subDays(45), applied: 99);

        $response = $this->getJson('/api/reports/water')->assertOk();

        $response->assertJsonCount(1, 'farms')
            ->assertJsonCount(2, 'farms.0.zones')
            ->assertJsonPath('farms.0.zones.0', [
                'id' => $bedA->id, 'name' => 'Bed A', 'crop' => 'Pechay', 'environment' => 'rooftop', 'is_active' => true,
                'readings_count' => 3, 'compared_count' => 2, 'not_recorded_count' => 1,
                'recommended_liters' => 25, 'applied_liters' => 22, 'difference_liters' => -3,
            ])
            ->assertJsonPath('farms.0.zones.1.difference_liters', 2)
            ->assertJsonPath('totals', [
                'readings_count' => 4, 'compared_count' => 3, 'not_recorded_count' => 1,
                'recommended_liters' => 25, 'applied_liters' => 24, 'difference_liters' => -1,
            ]);
    }

    public function test_water_report_respects_the_date_range(): void
    {
        $zone = $this->zone('Bed A');

        $this->enter($zone, 50, now()->subDays(10), applied: 10);
        $this->enter($zone, 50, now()->subDays(2), applied: 4);

        $query = http_build_query([
            'from' => now()->subDays(12)->toIso8601String(),
            'to' => now()->subDays(8)->toIso8601String(),
        ]);

        $this->getJson("/api/reports/water?{$query}")->assertOk()
            ->assertJsonPath('totals.readings_count', 1)
            ->assertJsonPath('totals.applied_liters', 10);
    }

    public function test_report_is_limited_to_assigned_farms(): void
    {
        $mine = $this->zone('Mine');
        $otherFarm = Farm::create(['name' => 'Someone Else']);
        $other = $this->zone('Not mine', $otherFarm);

        $this->enter($mine, 50, now()->subDay(), applied: 10);

        Sanctum::actingAs($superAdmin = User::factory()->superAdmin()->create());
        $this->enter($other, 50, now()->subDay(), applied: 7);

        $this->getJson('/api/reports/water')->assertOk()->assertJsonCount(2, 'farms');
        $this->getJson("/api/reports/water?farm_id={$otherFarm->id}")->assertOk()
            ->assertJsonCount(1, 'farms')
            ->assertJsonPath('totals.applied_liters', 7);

        Sanctum::actingAs($this->admin);

        $this->getJson('/api/reports/water')->assertOk()
            ->assertJsonCount(1, 'farms')
            ->assertJsonPath('totals.applied_liters', 10);
        $this->getJson("/api/reports/water?farm_id={$otherFarm->id}")->assertForbidden();
        $this->get("/api/reports/readings.csv?farm_id={$otherFarm->id}", ['Accept' => 'application/json'])->assertForbidden();
    }

    public function test_water_report_csv_download(): void
    {
        $this->enter($this->zone('Bed A'), 50, now()->subDay(), applied: 12);

        $response = $this->get('/api/reports/water.csv')->assertOk();

        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('sibol-water-report_', $response->headers->get('Content-Disposition'));

        $lines = explode("\n", trim($response->streamedContent()));

        $this->assertCount(3, $lines);
        $this->assertStringContainsString('Farm,Zone,Crop', $lines[0]);
        $this->assertSame('"Rooftop Garden","Bed A",Pechay,rooftop,1,1,0,10,12,2', $lines[1]);
        $this->assertStringStartsWith('"All farms"', $lines[2]);
    }

    public function test_readings_csv_lists_every_reading_in_local_time_and_neutralises_formulas(): void
    {
        $zone = $this->zone('Bed A');
        $at = Carbon::parse('2026-10-01 01:30:00', 'UTC');
        Carbon::setTestNow('2026-10-03 00:00:00');

        $this->enter($zone, 50, $at, applied: 12, notes: '=HYPERLINK("http://bad")');
        $this->enter($zone, 70, $at->copy()->addHour());

        $csv = $this->get('/api/reports/readings.csv?timezone=Asia/Manila')->assertOk()->streamedContent();
        $rows = array_map('str_getcsv', explode("\n", trim($csv)));

        $this->assertCount(3, $rows);

        $first = array_combine(array_map(fn ($heading) => ltrim($heading, "\xEF\xBB\xBF"), $rows[0]), $rows[1]);

        // 01:30 UTC is 09:30 in Manila.
        $this->assertSame('2026-10-01 09:30', $first['Recorded at']);
        $this->assertSame('Too Dry', $first['Soil status']);
        $this->assertSame('10', $first['Recommended liters']);
        $this->assertSame('12', $first['Water applied liters']);
        $this->assertSame('Ana Reyes', $first['Entered by']);
        $this->assertSame("'=HYPERLINK(\"http://bad\")", $first['Notes']);

        // No water applied recorded stays an empty cell, not a zero.
        $this->assertSame('', $rows[2][12]);
    }
}
