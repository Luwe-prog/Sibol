<?php

namespace Tests\Feature;

use App\Models\Farm;
use App\Models\Reading;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_data_shows_every_status_and_can_be_seeded_again(): void
    {
        $keep = Farm::create(['name' => 'My Real Farm']);

        $this->seed(DemoSeeder::class);
        $this->seed(DemoSeeder::class);

        // Re-running rebuilds the demo farms without duplicating them or touching other farms.
        $this->assertSame(3, Farm::count());
        $this->assertTrue($keep->exists());
        $this->assertSame(7, Zone::count());
        $this->assertSame(45, Reading::count());
        $this->assertSame(1, Reading::where('is_suspicious', true)->count());
        $this->assertSame(0, Reading::where('recorded_at', '>', now())->count());

        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->getJson('/api/dashboard')->assertOk()->assertJsonPath('summary', [
            'total' => 7, 'too_dry' => 1, 'optimal' => 4, 'too_wet' => 1, 'no_readings' => 1, 'stale' => 1, 'attention' => 3,
        ]);

        // The optimal zones with a week of readings get a next-watering estimate.
        $states = collect($this->getJson('/api/dashboard')->json('zones'))->pluck('watering_estimate.state', 'name');

        $this->assertSame('estimated', $states['Bed B']);
        $this->assertSame('estimated', $states['Rack 1']);
        $this->assertSame('due_now', $states['Bed A']);
        $this->assertSame('no_data', $states['Rack 3']);

        // The water report has something to show in every column.
        $totals = $this->getJson('/api/reports/water')->assertOk()->json('totals');

        $this->assertGreaterThan(0, $totals['recommended_liters']);
        $this->assertGreaterThan(0, $totals['applied_liters']);
        $this->assertGreaterThan(0, $totals['not_recorded_count']);
        $this->assertNotEquals(0, $totals['difference_liters']);
    }

    public function test_demo_admins_see_only_their_own_farm(): void
    {
        $this->seed(DemoSeeder::class);

        $this->postJson('/api/login', ['email' => 'ana@sibol.test', 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('user.must_change_password', false);

        Sanctum::actingAs(User::where('email', 'ana@sibol.test')->first());

        $this->getJson('/api/farms')->assertOk()
            ->assertJsonCount(1, 'farms')
            ->assertJsonPath('farms.0.name', 'Demo Rooftop Garden');
    }
}
