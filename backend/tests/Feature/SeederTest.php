<?php

namespace Tests\Feature;

use App\Enums\Environment;
use App\Enums\HumidityStatus;
use App\Enums\MoistureStatus;
use App\Enums\TempStatus;
use App\Enums\UserRole;
use App\Models\Crop;
use App\Models\Farm;
use App\Models\Reading;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeders_create_the_super_admin_and_six_crops_and_are_repeatable(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(1, User::where('role', UserRole::SuperAdmin)->count());
        $this->assertSame(6, Crop::count());
        $this->assertSame(0, Crop::whereColumn('soil_moisture_min', '>=', 'soil_moisture_max')->count());
    }

    public function test_farm_zone_reading_structure_and_soft_deletes(): void
    {
        $this->seed(DatabaseSeeder::class);

        $admin = User::factory()->create();
        $farm = Farm::create(['name' => 'Rooftop Garden']);
        $farm->users()->attach($admin);

        $zone = $farm->zones()->create([
            'crop_id' => Crop::where('name', 'Pechay')->value('id'),
            'name' => 'Bed A',
            'environment' => Environment::Rooftop,
            'water_factor' => 0.5,
        ]);

        $reading = $zone->readings()->create([
            'entered_by' => $admin->id,
            'recorded_at' => now(),
            'soil_moisture' => 45,
            'temperature' => 31,
            'humidity' => 70,
            'moisture_status' => MoistureStatus::TooDry,
            'temp_status' => TempStatus::TooHot,
            'humidity_status' => HumidityStatus::Optimal,
            'recommended_liters' => 12.5,
            'recommendation_text' => 'Water now.',
        ]);

        $this->assertTrue($admin->farms->contains($farm));
        $this->assertSame('Pechay', $zone->crop->name);
        $this->assertSame(Environment::Rooftop, $zone->fresh()->environment);
        $this->assertSame(MoistureStatus::TooDry, $reading->fresh()->moisture_status);
        $this->assertSame($admin->id, $reading->enteredByUser->id);

        $reading->delete();

        $this->assertSame(0, $zone->readings()->count());
        $this->assertSame(1, Reading::withTrashed()->count());
    }
}
