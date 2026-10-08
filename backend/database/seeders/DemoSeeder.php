<?php

namespace Database\Seeders;

use App\Enums\Environment;
use App\Enums\MoistureStatus;
use App\Enums\ReadingSource;
use App\Enums\UserRole;
use App\Models\Crop;
use App\Models\Farm;
use App\Models\User;
use App\Services\ReadingChecker;
use App\Services\RecommendationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Demo data for the defense: two farms, seven zones and about a week of readings.
 *
 * Run with:  php artisan db:seed --class=DemoSeeder
 *
 * Safe to re-run. It only touches the two "Demo ..." farms and the two demo Admins, and rebuilds
 * them with dates counted back from today, so run it again shortly before presenting.
 *
 * What the dashboard shows afterwards:
 *   Bed A   Too Dry (and too hot)      Bed D   stale: last reading 3 days ago
 *   Bed B   Optimal                    Rack 1  Optimal
 *   Bed C   Too Wet (overwatered)      Rack 2  Optimal, humidity too high
 *                                      Rack 3  no readings yet
 */
class DemoSeeder extends Seeder
{
    private const ROOFTOP = 'Demo Rooftop Garden';

    private const INDOOR = 'Demo Indoor Grow Room';

    public function run(RecommendationService $recommendations, ReadingChecker $checker): void
    {
        $this->call(CropSeeder::class);

        // Deleting a farm also deletes its zones and readings (database cascade).
        Farm::whereIn('name', [self::ROOFTOP, self::INDOOR])->get()->each->delete();

        $ana = $this->admin('Ana Reyes', 'ana@sibol.test');
        $ben = $this->admin('Ben Santos', 'ben@sibol.test');

        $rooftop = Farm::create([
            'name' => self::ROOFTOP,
            'location' => 'School building rooftop',
            'description' => 'Four raised beds in full sun.',
        ]);
        $rooftop->users()->sync([$ana->id]);

        $indoor = Farm::create([
            'name' => self::INDOOR,
            'location' => 'Science lab, room 204',
            'description' => 'Shelving racks under grow lights.',
        ]);
        $indoor->users()->sync([$ben->id]);

        // Each list runs from 7 days ago to today, one reading per day.
        $zones = [
            [
                'farm' => $rooftop, 'by' => $ana, 'name' => 'Bed A', 'crop' => 'Pechay', 'environment' => Environment::Rooftop, 'water_factor' => 0.6,
                'soil' => [72, 66, 61, 55, 74, 69, 63, 52],
                'temp' => [29, 30, 31, 33, 30, 29, 31, 32],
                'humidity' => [72, 70, 68, 64, 71, 73, 69, 66],
            ],
            [
                'farm' => $rooftop, 'by' => $ana, 'name' => 'Bed B', 'crop' => 'Kangkong', 'environment' => Environment::Rooftop, 'water_factor' => 0.8,
                'soil' => [85, 80, 76, 71, 68, 84, 79, 75],
                // 46 °C four days ago is saved as an unusual reading.
                'temp' => [29, 30, 31, 46, 30, 29, 31, 32],
                'humidity' => [72, 70, 68, 64, 71, 73, 69, 66],
                'notes' => [3 => 'Meter was sitting in direct sun.'],
            ],
            [
                'farm' => $rooftop, 'by' => $ana, 'name' => 'Bed C', 'crop' => 'Tomato', 'environment' => Environment::Rooftop, 'water_factor' => 1.0,
                'soil' => [70, 74, 79, 83, 86, 84, 85, 88],
                'temp' => [28, 29, 30, 29, 28, 29, 30, 29],
                'humidity' => [66, 68, 65, 69, 72, 70, 68, 74],
                // Watered 5 L every day no matter what was recommended, so the report shows it as "over".
                'always_apply' => 5.0,
            ],
            [
                'farm' => $rooftop, 'by' => $ana, 'name' => 'Bed D', 'crop' => 'Siling labuyo', 'environment' => Environment::Rooftop, 'water_factor' => 0.5,
                // Stops 3 days ago: this is the stale zone.
                'soil' => [62, 57, 52, 48, 58],
                'temp' => [29, 30, 31, 31, 30],
                'humidity' => [66, 64, 62, 60, 65],
            ],
            [
                'farm' => $indoor, 'by' => $ben, 'name' => 'Rack 1', 'crop' => 'Lettuce', 'environment' => Environment::Indoor, 'water_factor' => 0.3,
                'soil' => [68, 64, 61, 57, 72, 69, 66, 63],
                'temp' => [23, 22, 23, 24, 23, 22, 23, 24],
                'humidity' => [62, 60, 64, 66, 61, 63, 65, 62],
            ],
            [
                'farm' => $indoor, 'by' => $ben, 'name' => 'Rack 2', 'crop' => 'Basil', 'environment' => Environment::Indoor, 'water_factor' => 0.25,
                'soil' => [62, 58, 54, 51, 47, 64, 60, 57],
                'temp' => [24, 25, 24, 26, 25, 24, 25, 26],
                'humidity' => [58, 61, 63, 60, 66, 68, 65, 70],
            ],
            [
                'farm' => $indoor, 'by' => $ben, 'name' => 'Rack 3', 'crop' => 'Lettuce', 'environment' => Environment::Indoor, 'water_factor' => 0.3,
                'soil' => [], 'temp' => [], 'humidity' => [],
            ],
        ];

        foreach ($zones as $number => $plan) {
            $crop = Crop::where('name', $plan['crop'])->firstOrFail();

            $zone = $plan['farm']->zones()->create([
                'crop_id' => $crop->id,
                'name' => $plan['name'],
                'environment' => $plan['environment'],
                'water_factor' => $plan['water_factor'],
            ]);

            foreach ($plan['soil'] as $day => $soilMoisture) {
                $daysAgo = 7 - $day;
                $temperature = $plan['temp'][$day];
                $humidity = $plan['humidity'][$day];
                $recordedAt = $this->morningOf($daysAgo, minute: 5 + $number * 6);

                $result = $recommendations->evaluate($crop, $zone, $soilMoisture, $temperature, $humidity);
                $reasons = $checker->suspiciousReasons($soilMoisture, $temperature, $humidity, $recordedAt);

                $zone->readings()->create([
                    'entered_by' => $plan['by']->id,
                    'recorded_at' => $recordedAt,
                    'soil_moisture' => $soilMoisture,
                    'temperature' => $temperature,
                    'humidity' => $humidity,
                    'water_applied_liters' => $this->waterApplied($plan, $day, $daysAgo, $result),
                    'notes' => $plan['notes'][$day] ?? null,
                    'source' => ReadingSource::Manual,
                    'is_suspicious' => (bool) $reasons,
                    'suspicious_reason' => $reasons ? implode(' ', $reasons) : null,
                    ...$result,
                    'thresholds' => $crop->thresholdSnapshot(),
                ]);
            }
        }

        $this->command?->info('Demo data ready. Admins: ana@sibol.test and ben@sibol.test, password "password".');
    }

    private function admin(string $name, string $email): User
    {
        // updateOrCreate, so a re-run also restores the known password for the demo.
        return User::updateOrCreate(['email' => $email], [
            'name' => $name,
            'password' => 'password',
            'role' => UserRole::Admin,
            'is_active' => true,
            'must_change_password' => false,
        ]);
    }

    /**
     * Shortly after 7 in the morning, Manila time, the given number of days ago.
     */
    private function morningOf(int $daysAgo, int $minute): Carbon
    {
        $time = Carbon::now('Asia/Manila')->subDays($daysAgo)->setTime(7, $minute)->utc();

        // If the seeder runs before 7 a.m., "today's" reading would be in the future.
        return $time->isFuture() ? now()->subMinutes(20) : $time;
    }

    /**
     * What the Admin recorded as water applied on that visit; null means they did not record it.
     */
    private function waterApplied(array $plan, int $day, int $daysAgo, array $result): ?float
    {
        // Today's reading was just taken: nothing has been applied yet.
        if ($daysAgo === 0) {
            return null;
        }

        if (isset($plan['always_apply'])) {
            return $plan['always_apply'];
        }

        if ($result['moisture_status'] === MoistureStatus::TooDry) {
            // Close to the recommendation, a little under or over.
            return round($result['recommended_liters'] * ($day % 2 === 0 ? 0.9 : 1.1), 1);
        }

        // No water needed. Every third visit the Admin forgot to record the zero.
        return $day % 3 === 2 ? null : 0.0;
    }
}
