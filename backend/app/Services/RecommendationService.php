<?php

namespace App\Services;

use App\Enums\Environment;
use App\Enums\HumidityStatus;
use App\Enums\MoistureStatus;
use App\Enums\TempStatus;
use App\Models\Crop;
use App\Models\Zone;

/**
 * The decision rules from PROJECT_SCOPE.md section 3.
 *
 * Thresholds come from the crop (database); only the message wording lives here.
 */
class RecommendationService
{
    /**
     * @return array{moisture_status: MoistureStatus, temp_status: TempStatus, humidity_status: HumidityStatus, recommended_liters: float, recommendation_text: string}
     */
    public function evaluate(Crop $crop, Zone $zone, float $soilMoisture, float $temperature, float $humidity): array
    {
        $moistureStatus = match (true) {
            $soilMoisture < $crop->soil_moisture_min => MoistureStatus::TooDry,
            $soilMoisture > $crop->soil_moisture_max => MoistureStatus::TooWet,
            default => MoistureStatus::Optimal,
        };

        $tempStatus = match (true) {
            $temperature < $crop->temp_min => TempStatus::TooCold,
            $temperature > $crop->temp_max => TempStatus::TooHot,
            default => TempStatus::Optimal,
        };

        $humidityStatus = match (true) {
            $humidity < $crop->humidity_min => HumidityStatus::TooLow,
            $humidity > $crop->humidity_max => HumidityStatus::TooHigh,
            default => HumidityStatus::Optimal,
        };

        $liters = $moistureStatus === MoistureStatus::TooDry
            ? $this->recommendedLiters($crop, $zone, $soilMoisture)
            : 0.0;

        $messages = array_filter([
            $this->moistureMessage($moistureStatus, $liters),
            $this->tempMessage($tempStatus, $zone->environment),
            $this->humidityMessage($humidityStatus, $zone->environment),
        ]);

        return [
            'moisture_status' => $moistureStatus,
            'temp_status' => $tempStatus,
            'humidity_status' => $humidityStatus,
            'recommended_liters' => $liters,
            'recommendation_text' => implode(' ', $messages),
        ];
    }

    /**
     * recommended liters = max(0, target moisture − current moisture) × zone water factor,
     * where target moisture is the midpoint of the crop's optimal range.
     */
    public function recommendedLiters(Crop $crop, Zone $zone, float $soilMoisture): float
    {
        $target = ($crop->soil_moisture_min + $crop->soil_moisture_max) / 2;

        return round(max(0, $target - $soilMoisture) * $zone->water_factor, 2);
    }

    private function moistureMessage(MoistureStatus $status, float $liters): string
    {
        return match ($status) {
            MoistureStatus::TooDry => sprintf('Water now: apply about %s L.', rtrim(rtrim(number_format($liters, 2, '.', ''), '0'), '.')),
            MoistureStatus::Optimal => 'No watering needed.',
            MoistureStatus::TooWet => 'Hold off watering, check drainage, and reduce the amount at the next watering.',
        };
    }

    private function tempMessage(TempStatus $status, Environment $environment): ?string
    {
        $rooftop = $environment === Environment::Rooftop;

        return match ($status) {
            TempStatus::TooHot => $rooftop
                ? 'It is too hot: water early in the morning or late in the afternoon, and add shade netting.'
                : 'It is too hot: improve airflow, and move plants away from heat sources or raise the grow lights.',
            TempStatus::TooCold => $rooftop
                ? 'It is too cold: shield plants from wind and cover them at night.'
                : 'It is too cold: move plants away from air conditioning and cold drafts.',
            TempStatus::Optimal => null,
        };
    }

    private function humidityMessage(HumidityStatus $status, Environment $environment): ?string
    {
        $rooftop = $environment === Environment::Rooftop;

        return match ($status) {
            HumidityStatus::TooHigh => $rooftop
                ? 'Humidity is too high: water in the morning, keep leaves dry, space plants apart, and watch for fungal disease.'
                : 'Humidity is too high: increase ventilation.',
            HumidityStatus::TooLow => $rooftop
                ? 'Humidity is too low: add mulch and check soil moisture more often.'
                : 'Humidity is too low: mist the plants or group them together.',
            HumidityStatus::Optimal => null,
        };
    }
}
