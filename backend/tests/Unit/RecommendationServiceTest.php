<?php

namespace Tests\Unit;

use App\Enums\Environment;
use App\Enums\HumidityStatus;
use App\Enums\MoistureStatus;
use App\Enums\TempStatus;
use App\Models\Crop;
use App\Models\Zone;
use App\Services\RecommendationService;
use PHPUnit\Framework\TestCase;

class RecommendationServiceTest extends TestCase
{
    private function crop(): Crop
    {
        // Pechay: target moisture is the midpoint, 70.
        return new Crop([
            'soil_moisture_min' => 60, 'soil_moisture_max' => 80,
            'temp_min' => 18, 'temp_max' => 30,
            'humidity_min' => 60, 'humidity_max' => 80,
        ]);
    }

    private function zone(Environment $environment = Environment::Rooftop, float $waterFactor = 0.5): Zone
    {
        return new Zone(['environment' => $environment, 'water_factor' => $waterFactor]);
    }

    public function test_too_dry_recommends_liters_from_the_formula(): void
    {
        $result = (new RecommendationService)->evaluate($this->crop(), $this->zone(), 45, 25, 70);

        // (70 − 45) × 0.5 = 12.5
        $this->assertSame(MoistureStatus::TooDry, $result['moisture_status']);
        $this->assertSame(12.5, $result['recommended_liters']);
        $this->assertSame('Water now: apply about 12.5 L.', $result['recommendation_text']);
    }

    public function test_optimal_needs_no_water(): void
    {
        $result = (new RecommendationService)->evaluate($this->crop(), $this->zone(), 65, 25, 70);

        $this->assertSame(MoistureStatus::Optimal, $result['moisture_status']);
        $this->assertSame(0.0, $result['recommended_liters']);
        $this->assertSame('No watering needed.', $result['recommendation_text']);
    }

    public function test_too_wet_holds_off_with_zero_liters(): void
    {
        $result = (new RecommendationService)->evaluate($this->crop(), $this->zone(), 92, 25, 70);

        $this->assertSame(MoistureStatus::TooWet, $result['moisture_status']);
        $this->assertSame(0.0, $result['recommended_liters']);
        $this->assertStringContainsString('Hold off watering', $result['recommendation_text']);
    }

    public function test_range_edges_count_as_optimal(): void
    {
        $service = new RecommendationService;

        $low = $service->evaluate($this->crop(), $this->zone(), 60, 18, 60);
        $high = $service->evaluate($this->crop(), $this->zone(), 80, 30, 80);

        foreach ([$low, $high] as $result) {
            $this->assertSame(MoistureStatus::Optimal, $result['moisture_status']);
            $this->assertSame(TempStatus::Optimal, $result['temp_status']);
            $this->assertSame(HumidityStatus::Optimal, $result['humidity_status']);
        }
    }

    public function test_environment_changes_the_temperature_and_humidity_advice(): void
    {
        $service = new RecommendationService;

        $rooftop = $service->evaluate($this->crop(), $this->zone(Environment::Rooftop), 65, 36, 90);
        $indoor = $service->evaluate($this->crop(), $this->zone(Environment::Indoor), 65, 36, 90);

        $this->assertSame(TempStatus::TooHot, $rooftop['temp_status']);
        $this->assertSame(HumidityStatus::TooHigh, $rooftop['humidity_status']);
        $this->assertStringContainsString('shade netting', $rooftop['recommendation_text']);
        $this->assertStringContainsString('fungal disease', $rooftop['recommendation_text']);
        $this->assertStringContainsString('improve airflow', $indoor['recommendation_text']);
        $this->assertStringContainsString('increase ventilation', $indoor['recommendation_text']);
    }

    public function test_cold_and_dry_air_are_flagged(): void
    {
        $result = (new RecommendationService)->evaluate($this->crop(), $this->zone(Environment::Indoor), 65, 16, 40);

        $this->assertSame(TempStatus::TooCold, $result['temp_status']);
        $this->assertSame(HumidityStatus::TooLow, $result['humidity_status']);
        $this->assertStringContainsString('cold drafts', $result['recommendation_text']);
        $this->assertStringContainsString('mist the plants', $result['recommendation_text']);
    }
}
