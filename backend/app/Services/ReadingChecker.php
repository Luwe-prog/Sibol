<?php

namespace App\Services;

use Carbon\CarbonInterface;

/**
 * Finds readings that are possible but unlikely (PROJECT_SCOPE.md section 2).
 * Impossible values are rejected earlier by request validation.
 */
class ReadingChecker
{
    /**
     * @return list<string> One sentence per reason; empty when the reading looks normal.
     */
    public function suspiciousReasons(float $soilMoisture, float $temperature, float $humidity, CarbonInterface $recordedAt): array
    {
        $reasons = [];

        if ($soilMoisture <= 0 || $soilMoisture >= 100) {
            $reasons[] = sprintf('Soil moisture of exactly %s%% usually means a meter problem.', $soilMoisture <= 0 ? '0' : '100');
        }

        if ($temperature < 15) {
            $reasons[] = 'Temperature is below 15 °C.';
        } elseif ($temperature > 45) {
            $reasons[] = 'Temperature is above 45 °C.';
        }

        if ($humidity < 20) {
            $reasons[] = 'Humidity is below 20%.';
        }

        if ($recordedAt->lt(now()->subDays(30))) {
            $reasons[] = 'The reading is dated more than 30 days ago.';
        }

        return $reasons;
    }
}
