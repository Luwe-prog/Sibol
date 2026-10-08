<?php

namespace Tests\Feature;

use App\Enums\Environment;
use App\Models\Crop;
use App\Models\Farm;
use App\Models\Reading;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\CropSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReadingTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Zone $zone;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CropSeeder::class);

        $this->admin = User::factory()->create();
        $farm = Farm::create(['name' => 'Rooftop Garden']);
        $farm->users()->attach($this->admin);

        // Pechay: soil 60-80, temp 18-30, humidity 60-80.
        $this->zone = $farm->zones()->create([
            'crop_id' => Crop::where('name', 'Pechay')->value('id'),
            'name' => 'Bed A',
            'environment' => Environment::Rooftop,
            'water_factor' => 0.5,
        ]);

        Sanctum::actingAs($this->admin);
    }

    private function reading(array $overrides = []): array
    {
        return ['soil_moisture' => 45, 'temperature' => 25, 'humidity' => 70, ...$overrides];
    }

    public function test_entering_a_dry_reading_returns_status_and_liters(): void
    {
        $response = $this->postJson("/api/zones/{$this->zone->id}/readings", $this->reading());

        $response->assertCreated()
            ->assertJsonPath('reading.moisture_status', 'too_dry')
            ->assertJsonPath('reading.temp_status', 'optimal')
            ->assertJsonPath('reading.humidity_status', 'optimal')
            ->assertJsonPath('reading.recommended_liters', 12.5)
            ->assertJsonPath('reading.entered_by', $this->admin->id)
            ->assertJsonPath('reading.source', 'manual')
            ->assertJsonPath('reading.is_suspicious', false)
            ->assertJsonPath('reading.zone.crop.name', 'Pechay');
    }

    public function test_impossible_values_are_rejected(): void
    {
        $this->postJson("/api/zones/{$this->zone->id}/readings", $this->reading([
            'soil_moisture' => 120,
            'temperature' => 75,
            'humidity' => -5,
            'water_applied_liters' => -1,
            'recorded_at' => now()->addDay()->toIso8601String(),
        ]))->assertStatus(422)->assertJsonValidationErrors([
            'soil_moisture', 'temperature', 'humidity', 'water_applied_liters', 'recorded_at',
        ]);

        $this->assertSame(0, Reading::count());
    }

    public function test_suspicious_reading_needs_confirmation_then_is_saved_flagged(): void
    {
        $payload = $this->reading(['temperature' => 48]);

        $this->postJson("/api/zones/{$this->zone->id}/readings", $payload)
            ->assertStatus(409)
            ->assertJsonPath('code', 'suspicious_reading')
            ->assertJsonCount(1, 'reasons');

        $this->assertSame(0, Reading::count());

        $this->postJson("/api/zones/{$this->zone->id}/readings", [...$payload, 'confirm_suspicious' => true])
            ->assertCreated()
            ->assertJsonPath('reading.is_suspicious', true)
            ->assertJsonPath('reading.temp_status', 'too_hot');
    }

    public function test_backdating_is_allowed(): void
    {
        $when = now()->subDays(3)->startOfMinute();

        $response = $this->postJson("/api/zones/{$this->zone->id}/readings", $this->reading([
            'recorded_at' => $when->toIso8601String(),
        ]))->assertCreated();

        $this->assertTrue($when->equalTo(Reading::find($response->json('reading.id'))->recorded_at));
    }

    public function test_saving_water_applied_alone_does_not_recompute_the_status(): void
    {
        $id = $this->postJson("/api/zones/{$this->zone->id}/readings", $this->reading())->json('reading.id');

        // Thresholds change after the reading was taken.
        $this->zone->crop->update(['soil_moisture_min' => 30, 'soil_moisture_max' => 50]);

        $this->putJson("/api/readings/{$id}", ['water_applied_liters' => 10])
            ->assertOk()
            ->assertJsonPath('reading.water_applied_liters', 10)
            ->assertJsonPath('reading.moisture_status', 'too_dry')
            ->assertJsonPath('reading.recommended_liters', 12.5);
    }

    public function test_editing_a_measurement_recomputes_the_status(): void
    {
        $id = $this->postJson("/api/zones/{$this->zone->id}/readings", $this->reading())->json('reading.id');

        $this->putJson("/api/readings/{$id}", $this->reading(['soil_moisture' => 90]))
            ->assertOk()
            ->assertJsonPath('reading.moisture_status', 'too_wet')
            ->assertJsonPath('reading.recommended_liters', 0);
    }

    public function test_deleting_a_reading_is_a_soft_delete(): void
    {
        $id = $this->postJson("/api/zones/{$this->zone->id}/readings", $this->reading())->json('reading.id');

        $this->deleteJson("/api/readings/{$id}")->assertOk();

        $this->getJson("/api/readings/{$id}")->assertNotFound();
        $this->getJson("/api/zones/{$this->zone->id}/readings")->assertOk()->assertJsonCount(0, 'readings');
        $this->assertSame(1, Reading::withTrashed()->count());
    }

    public function test_inactive_zone_takes_no_new_readings_but_keeps_history(): void
    {
        $this->postJson("/api/zones/{$this->zone->id}/readings", $this->reading())->assertCreated();
        $this->zone->update(['is_active' => false]);

        $this->postJson("/api/zones/{$this->zone->id}/readings", $this->reading())->assertStatus(422);
        $this->getJson("/api/zones/{$this->zone->id}/readings")->assertOk()->assertJsonCount(1, 'readings');
    }

    public function test_admin_cannot_touch_a_farm_they_are_not_assigned_to(): void
    {
        $otherFarm = Farm::create(['name' => 'Someone Else']);
        $otherZone = $otherFarm->zones()->create([
            'crop_id' => $this->zone->crop_id,
            'name' => 'Rack 1',
            'environment' => Environment::Indoor,
            'water_factor' => 1,
        ]);

        $this->getJson("/api/farms/{$otherFarm->id}")->assertForbidden();
        $this->getJson("/api/zones/{$otherZone->id}")->assertForbidden();
        $this->getJson("/api/zones/{$otherZone->id}/readings")->assertForbidden();
        $this->postJson("/api/zones/{$otherZone->id}/readings", $this->reading())->assertForbidden();
        $this->postJson("/api/farms/{$otherFarm->id}/zones", [])->assertForbidden();

        $this->getJson('/api/farms')->assertOk()->assertJsonCount(1, 'farms')->assertJsonPath('farms.0.name', 'Rooftop Garden');
    }

    public function test_super_admin_can_enter_readings_on_any_farm(): void
    {
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->postJson("/api/zones/{$this->zone->id}/readings", $this->reading())->assertCreated();
        $this->getJson('/api/farms')->assertOk()->assertJsonCount(1, 'farms');
    }
}
