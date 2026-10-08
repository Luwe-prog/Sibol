<?php

namespace App\Http\Controllers;

use App\Enums\MoistureStatus;
use App\Models\Zone;
use App\Services\WateringEstimator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Every active zone the user may see, with its latest reading.
     * Inactive zones and farms are left out; their history stays reachable from the Farms screen.
     */
    public function index(Request $request, WateringEstimator $estimator): JsonResponse
    {
        $farmIds = $request->user()->accessibleFarms()->where('is_active', true)->pluck('id');

        $zones = Zone::whereIn('farm_id', $farmIds)
            ->where('is_active', true)
            ->with('farm:id,name', 'crop:id,name,soil_moisture_min', 'latestReading')
            ->orderBy('name')
            ->get();

        $staleBefore = now()->subDays(Zone::STALE_AFTER_DAYS);
        $recentReadings = $estimator->recentReadings($zones->pluck('id'))->groupBy('zone_id');

        $zones->each(function (Zone $zone) use ($staleBefore, $estimator, $recentReadings) {
            $latest = $zone->latestReading;

            // Stale: the zone has readings, but none in the last two days.
            $zone->setAttribute('is_stale', $latest !== null && $latest->recorded_at->lt($staleBefore));
            $zone->setAttribute('needs_attention', in_array($latest?->moisture_status, [MoistureStatus::TooDry, MoistureStatus::TooWet], true));
            $zone->setAttribute('watering_estimate', $estimator->estimate($zone, $recentReadings->get($zone->id, collect())));
        });

        $countByStatus = fn (MoistureStatus $status) => $zones->filter(fn (Zone $zone) => $zone->latestReading?->moisture_status === $status)->count();

        return response()->json([
            'zones' => $zones,
            'summary' => [
                'total' => $zones->count(),
                'too_dry' => $countByStatus(MoistureStatus::TooDry),
                'optimal' => $countByStatus(MoistureStatus::Optimal),
                'too_wet' => $countByStatus(MoistureStatus::TooWet),
                'no_readings' => $zones->whereNull('latestReading')->count(),
                'stale' => $zones->where('is_stale', true)->count(),
                // Zones listed under "Needs attention": too dry, too wet, or stale.
                'attention' => $zones->filter(fn (Zone $zone) => $zone->needs_attention || $zone->is_stale)->count(),
            ],
            'stale_after_days' => Zone::STALE_AFTER_DAYS,
        ]);
    }
}
