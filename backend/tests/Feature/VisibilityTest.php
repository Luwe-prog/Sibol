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

class VisibilityTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Farm $farm;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CropSeeder::class);

        $this->admin = User::factory()->create();
        $this->farm = Farm::create(['name' => 'Rooftop Garden']);
        $this->farm->users()->attach($this->admin);

        Sanctum::actingAs($this->admin);
    }

    private function zone(string $name, ?Farm $farm = null): Zone
    {
        // Pechay: soil 60-80.
        return ($farm ?? $this->farm)->zones()->create([
            'crop_id' => Crop::where('name', 'Pechay')->value('id'),
            'name' => $name,
            'environment' => Environment::Rooftop,
            'water_factor' => 0.5,
        ]);
    }

    private function enter(Zone $zone, float $soilMoisture, Carbon $at): void
    {
        $this->postJson("/api/zones/{$zone->id}/readings", [
            'soil_moisture' => $soilMoisture,
            'temperature' => 25,
            'humidity' => 70,
            'recorded_at' => $at->toIso8601String(),
            // Readings dated more than 30 days back count as unusual and need confirming.
            'confirm_suspicious' => true,
        ])->assertCreated();
    }

    public function test_dashboard_shows_latest_status_attention_and_stale_flags(): void
    {
        $dry = $this->zone('A Dry');
        $fine = $this->zone('B Fine');
        $stale = $this->zone('C Stale');
        $this->zone('D Empty');

        // The latest reading decides the status, not the last one entered.
        $this->enter($dry, 45, now()->subHour());
        $this->enter($dry, 70, now()->subDays(1));
        $this->enter($fine, 70, now()->subHours(2));
        $this->enter($stale, 90, now()->subDays(3));

        $response = $this->getJson('/api/dashboard')->assertOk();

        $response->assertJsonPath('summary', [
            'total' => 4, 'too_dry' => 1, 'optimal' => 1, 'too_wet' => 1, 'no_readings' => 1, 'stale' => 1, 'attention' => 2,
        ]);

        $zones = collect($response->json('zones'))->keyBy('name');

        $this->assertSame('too_dry', $zones['A Dry']['latest_reading']['moisture_status']);
        $this->assertTrue($zones['A Dry']['needs_attention']);
        $this->assertFalse($zones['A Dry']['is_stale']);

        $this->assertFalse($zones['B Fine']['needs_attention']);

        $this->assertTrue($zones['C Stale']['is_stale']);
        $this->assertTrue($zones['C Stale']['needs_attention']);

        $this->assertNull($zones['D Empty']['latest_reading']);
        $this->assertFalse($zones['D Empty']['is_stale']);
        $this->assertSame('Rooftop Garden', $zones['D Empty']['farm']['name']);
    }

    public function test_dashboard_hides_inactive_zones_and_other_admins_farms(): void
    {
        $this->zone('Mine');
        $this->zone('Retired')->update(['is_active' => false]);
        $this->zone('Not mine', Farm::create(['name' => 'Someone Else']));

        $closed = Farm::create(['name' => 'Closed', 'is_active' => false]);
        $closed->users()->attach($this->admin);
        $this->zone('In closed farm', $closed);

        $this->getJson('/api/dashboard')->assertOk()
            ->assertJsonCount(1, 'zones')
            ->assertJsonPath('zones.0.name', 'Mine');

        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->getJson('/api/dashboard')->assertOk()->assertJsonCount(2, 'zones');
    }

    public function test_history_filters_by_date_range_and_status(): void
    {
        $zone = $this->zone('Bed A');

        $this->enter($zone, 45, now()->subDays(10));
        $this->enter($zone, 70, now()->subDays(5));
        $this->enter($zone, 90, now()->subDays(1));

        $this->getJson("/api/zones/{$zone->id}/readings")->assertOk()
            ->assertJsonCount(3, 'readings')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('readings.0.moisture_status', 'too_wet');

        $this->getJson("/api/zones/{$zone->id}/readings?status=too_dry")->assertOk()
            ->assertJsonCount(1, 'readings')
            ->assertJsonPath('readings.0.soil_moisture', 45);

        $query = http_build_query([
            'from' => now()->subDays(6)->toIso8601String(),
            'to' => now()->subDays(2)->toIso8601String(),
        ]);
        $this->getJson("/api/zones/{$zone->id}/readings?{$query}")->assertOk()
            ->assertJsonCount(1, 'readings')
            ->assertJsonPath('readings.0.moisture_status', 'optimal');

        $this->getJson("/api/zones/{$zone->id}/readings?status=soggy")->assertStatus(422);
    }

    public function test_history_is_paginated(): void
    {
        $zone = $this->zone('Bed A');

        foreach (range(1, 23) as $hoursAgo) {
            $this->enter($zone, 70, now()->subHours($hoursAgo));
        }

        $this->getJson("/api/zones/{$zone->id}/readings")->assertOk()
            ->assertJsonCount(20, 'readings')
            ->assertJsonPath('meta.last_page', 2);

        $this->getJson("/api/zones/{$zone->id}/readings?page=2")->assertOk()->assertJsonCount(3, 'readings');
    }

    public function test_trend_returns_points_oldest_first_within_the_range(): void
    {
        $zone = $this->zone('Bed A');

        $this->enter($zone, 45, now()->subDays(40));
        $this->enter($zone, 90, now()->subDays(1));
        $this->enter($zone, 70, now()->subDays(5));

        // Default range is the last 30 days.
        $this->getJson("/api/zones/{$zone->id}/trend")->assertOk()
            ->assertJsonCount(2, 'points')
            ->assertJsonPath('points.0.soil_moisture', 70)
            ->assertJsonPath('points.1.soil_moisture', 90);

        $query = http_build_query(['from' => now()->subDays(60)->toIso8601String()]);
        $this->getJson("/api/zones/{$zone->id}/trend?{$query}")->assertOk()->assertJsonCount(3, 'points');
    }

    public function test_trend_and_history_are_limited_to_assigned_farms(): void
    {
        $other = $this->zone('Not mine', Farm::create(['name' => 'Someone Else']));

        $this->getJson("/api/zones/{$other->id}/trend")->assertForbidden();
        $this->getJson("/api/zones/{$other->id}/readings")->assertForbidden();
    }
}
