<?php

namespace App\Services;

use App\Models\Reading;
use App\Models\Zone;
use Illuminate\Support\Collection;

/**
 * Next-watering estimate (PROJECT_SCOPE.md section 3, stretch).
 *
 * Looks at how fast a zone's soil has been drying between recent readings, and from that
 * estimates when its moisture will fall below the crop's minimum.
 */
class WateringEstimator
{
    /** Only readings this recent are used, so the rate reflects current weather. */
    public const LOOKBACK_DAYS = 14;

    /** Two readings further apart than this say little about the drying rate in between. */
    private const MAX_GAP_DAYS = 4;

    /** At least this many drying intervals are needed before an estimate is shown. */
    private const MIN_INTERVALS = 2;

    /**
     * @return array{state: string, drying_rate_per_day: ?float, due_at: ?string, intervals: int}
     */
    public function forZone(Zone $zone): array
    {
        return $this->estimate($zone, $this->recentReadings([$zone->id]));
    }

    /**
     * Readings of several zones in one query, for the dashboard. Group the result by zone_id.
     *
     * @param  iterable<int>  $zoneIds
     * @return Collection<int, Reading>
     */
    public function recentReadings(iterable $zoneIds): Collection
    {
        return Reading::whereIn('zone_id', $zoneIds)
            ->where('recorded_at', '>=', now()->subDays(self::LOOKBACK_DAYS))
            ->orderBy('recorded_at')
            ->orderBy('id')
            ->get(['id', 'zone_id', 'recorded_at', 'soil_moisture']);
    }

    /**
     * States:
     *   no_data          no reading in the lookback window
     *   not_enough_data  too few drying intervals to work out a rate
     *   due_now          already below the minimum, or estimated to have reached it by now
     *   estimated        due_at holds the estimated time
     *
     * @param  Collection<int, Reading>  $readings  One zone's readings, oldest first.
     * @return array{state: string, drying_rate_per_day: ?float, due_at: ?string, intervals: int}
     */
    public function estimate(Zone $zone, Collection $readings): array
    {
        $readings = $readings->values();
        $latest = $readings->last();

        if (! $latest) {
            return $this->result('no_data');
        }

        $minimum = $zone->crop->soil_moisture_min;

        if ($latest->soil_moisture < $minimum) {
            return $this->result('due_now');
        }

        // Add up every stretch where moisture fell between two readings. Stretches where it
        // rose are watering (or rain), not drying, so they are skipped.
        $dropped = 0.0;
        $days = 0.0;
        $intervals = 0;

        for ($i = 1; $i < $readings->count(); $i++) {
            $earlier = $readings[$i - 1];
            $later = $readings[$i];

            $gap = $earlier->recorded_at->diffInMinutes($later->recorded_at) / 1440;

            if ($gap < 1 / 24 || $gap > self::MAX_GAP_DAYS || $later->soil_moisture >= $earlier->soil_moisture) {
                continue;
            }

            $dropped += $earlier->soil_moisture - $later->soil_moisture;
            $days += $gap;
            $intervals++;
        }

        if ($intervals < self::MIN_INTERVALS) {
            return $this->result('not_enough_data', intervals: $intervals);
        }

        $rate = $dropped / $days;
        $dueAt = $latest->recorded_at->copy()->addMinutes((int) round(($latest->soil_moisture - $minimum) / $rate * 1440));

        return $this->result($dueAt->isPast() ? 'due_now' : 'estimated', $rate, $dueAt->toIso8601String(), $intervals);
    }

    private function result(string $state, ?float $rate = null, ?string $dueAt = null, int $intervals = 0): array
    {
        return [
            'state' => $state,
            // Percentage points of soil moisture lost per day.
            'drying_rate_per_day' => $rate === null ? null : round($rate, 1),
            'due_at' => $dueAt,
            'intervals' => $intervals,
        ];
    }
}
