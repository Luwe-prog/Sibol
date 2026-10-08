<?php

namespace Database\Seeders;

use App\Models\Crop;
use Illuminate\Database\Seeder;

class CropSeeder extends Seeder
{
    /**
     * Seed the six starter crops.
     *
     * These thresholds are provisional working estimates (see PROJECT_SCOPE.md section 4).
     * Replace them with cited values, and fill in source_reference, before the defense.
     */
    public function run(): void
    {
        $source = 'Provisional (uncited)';

        // name, soil moisture min/max (%), temp min/max (°C), humidity min/max (%)
        $crops = [
            ['Pechay', 60, 80, 18, 30, 60, 80],
            ['Lettuce', 60, 80, 15, 25, 50, 70],
            ['Kangkong', 70, 90, 24, 35, 60, 85],
            ['Tomato', 60, 80, 20, 30, 50, 70],
            ['Siling labuyo', 50, 70, 21, 32, 50, 70],
            ['Basil', 50, 70, 20, 30, 40, 60],
        ];

        foreach ($crops as [$name, $soilMin, $soilMax, $tempMin, $tempMax, $humidityMin, $humidityMax]) {
            // firstOrCreate, so re-seeding never overwrites thresholds the Super Admin has edited.
            Crop::firstOrCreate(
                ['name' => $name],
                [
                    'soil_moisture_min' => $soilMin,
                    'soil_moisture_max' => $soilMax,
                    'temp_min' => $tempMin,
                    'temp_max' => $tempMax,
                    'humidity_min' => $humidityMin,
                    'humidity_max' => $humidityMax,
                    'source_reference' => $source,
                    'is_active' => true,
                ],
            );
        }
    }
}
