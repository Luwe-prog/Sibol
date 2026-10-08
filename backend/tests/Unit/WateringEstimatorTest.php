<?php

namespace Tests\Unit;

use App\Models\Crop;
use App\Models\Reading;
use App\Models\Zone;
use App\Services\WateringEstimator;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class WateringEstimatorTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-10-08 12:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function zone(): Zone
    {
        $zone = new Zone;
        $zone->setRelation('crop', new Crop(['soil_moisture_min' => 60, 'soil_moisture_max' => 80]));

        return $zone;
    }

    /**
     * @param  array<int|string, float>  $moistureByDaysAgo
     */
    private function readings(array $moistureByDaysAgo)
    {
        return collect($moistureByDaysAgo)->map(fn ($moisture, $daysAgo) => new Reading([
            'recorded_at' => now()->subHours((int) round((float) $daysAgo * 24)),
            'soil_moisture' => $moisture,
        ]))->values();
    }

    public function test_estimates_when_the_zone_will_reach_the_minimum(): void
    {
        // Drying 4 points a day; 72 now, so the minimum of 60 is 3 days away.
        $result = (new WateringEstimator)->estimate($this->zone(), $this->readings(['2' => 80, '1' => 76, '0' => 72]));

        $this->assertSame('estimated', $result['state']);
        $this->assertSame(4.0, $result['drying_rate_per_day']);
        $this->assertSame(2, $result['intervals']);
        $this->assertTrue(now()->addDays(3)->equalTo($result['due_at']));
    }

    public function test_watering_jumps_are_not_counted_as_drying(): void
    {
        // 80 -> 74 -> 68, watered up to 82, then 82 -> 76. Three drying days at 6 points a day.
        $result = (new WateringEstimator)->estimate($this->zone(), $this->readings(['4' => 80, '3' => 74, '2' => 68, '1' => 82, '0' => 76]));

        $this->assertSame(6.0, $result['drying_rate_per_day']);
        $this->assertSame(3, $result['intervals']);
    }

    public function test_already_too_dry_is_due_now(): void
    {
        $result = (new WateringEstimator)->estimate($this->zone(), $this->readings(['2' => 70, '1' => 64, '0' => 58]));

        $this->assertSame('due_now', $result['state']);
    }

    public function test_an_old_reading_that_should_have_dried_out_by_now_is_due_now(): void
    {
        // Last read 62 three days ago while losing 4 a day: it passed 60 long ago.
        $result = (new WateringEstimator)->estimate($this->zone(), $this->readings(['5' => 70, '4' => 66, '3' => 62]));

        $this->assertSame('due_now', $result['state']);
    }

    public function test_too_little_history_gives_no_estimate(): void
    {
        $estimator = new WateringEstimator;

        $this->assertSame('no_data', $estimator->estimate($this->zone(), collect())['state']);
        $this->assertSame('not_enough_data', $estimator->estimate($this->zone(), $this->readings(['1' => 76, '0' => 72]))['state']);
        // Readings a week apart say nothing about the days in between.
        $this->assertSame('not_enough_data', $estimator->estimate($this->zone(), $this->readings(['12' => 80, '6' => 76, '0' => 72]))['state']);
    }
}
