<?php

namespace App\Http\Controllers;

use App\Enums\MoistureStatus;
use App\Enums\ReadingSource;
use App\Models\ActivityLog;
use App\Models\Farm;
use App\Models\Reading;
use App\Models\Zone;
use App\Services\ReadingChecker;
use App\Services\RecommendationService;
use App\Services\WateringEstimator;
use App\Support\ReadingRules;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class ReadingController extends Controller
{
    public function __construct(
        private RecommendationService $recommendations,
        private ReadingChecker $checker,
        private WateringEstimator $estimator,
    ) {}

    /**
     * History of a zone, newest first, filterable by date range and soil moisture status.
     */
    public function index(Request $request, Zone $zone): JsonResponse
    {
        $this->authorizeFarm($request, $zone->farm);

        return $this->history($request, $zone->readings());
    }

    /**
     * History of every zone in a farm, with an extra filter for one zone.
     */
    public function farmIndex(Request $request, Farm $farm): JsonResponse
    {
        $this->authorizeFarm($request, $farm);

        $zoneId = $request->validate([
            'zone_id' => ['nullable', 'integer', Rule::exists('zones', 'id')->where('farm_id', $farm->id)],
        ])['zone_id'] ?? null;

        $query = Reading::whereIn('zone_id', $farm->zones()->select('id'))
            ->when($zoneId, fn ($query) => $query->where('zone_id', $zoneId))
            ->with('zone:id,name');

        return $this->history($request, $query);
    }

    /**
     * Points for the trend charts, oldest first. Defaults to the last 30 days.
     */
    public function trend(Request $request, Zone $zone): JsonResponse
    {
        $this->authorizeFarm($request, $zone->farm);

        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = isset($filters['from']) ? Carbon::parse($filters['from'])->utc() : now()->subDays(30);

        // Newest 1000 in the range, then flipped, so a very long range still ends at the latest reading.
        $points = $zone->readings()
            ->where('recorded_at', '>=', $from)
            ->when($filters['to'] ?? null, fn ($query, $to) => $query->where('recorded_at', '<=', Carbon::parse($to)->utc()))
            ->orderByDesc('recorded_at')
            ->limit(1000)
            ->get(['id', 'recorded_at', 'soil_moisture', 'temperature', 'humidity', 'moisture_status', 'temp_status', 'humidity_status', 'thresholds'])
            ->reverse()
            ->values();

        return response()->json(['points' => $points]);
    }

    public function store(Request $request, Zone $zone): JsonResponse
    {
        $this->authorizeFarm($request, $zone->farm);
        abort_unless($zone->is_active && $zone->farm->is_active, 422, 'This zone is inactive, so it cannot take new readings.');

        $data = $request->validate($this->rules(partial: false), ReadingRules::messages());

        $recordedAt = isset($data['recorded_at']) ? Carbon::parse($data['recorded_at'])->utc() : now();

        $reasons = $this->checker->suspiciousReasons($data['soil_moisture'], $data['temperature'], $data['humidity'], $recordedAt);
        if ($reasons && ! $request->boolean('confirm_suspicious')) {
            return $this->suspiciousResponse($reasons);
        }

        $reading = $zone->readings()->create([
            'entered_by' => $request->user()->id,
            'recorded_at' => $recordedAt,
            'soil_moisture' => $data['soil_moisture'],
            'temperature' => $data['temperature'],
            'humidity' => $data['humidity'],
            'water_applied_liters' => $data['water_applied_liters'] ?? null,
            'notes' => $data['notes'] ?? null,
            'source' => ReadingSource::Manual,
            ...$this->suspiciousColumns($reasons),
            ...$this->recommendations->evaluate($zone->crop, $zone, $data['soil_moisture'], $data['temperature'], $data['humidity']),
            'thresholds' => $zone->crop->thresholdSnapshot(),
        ]);

        return response()->json(['reading' => $this->withDetails($reading)], 201);
    }

    public function show(Request $request, Reading $reading): JsonResponse
    {
        $this->authorizeFarm($request, $reading->zone->farm);

        return response()->json(['reading' => $this->withDetails($reading)]);
    }

    /**
     * Accepts a partial update, so the result screen can save just the water applied.
     * The status is recomputed (with the crop's current thresholds) only when a measurement is sent.
     */
    public function update(Request $request, Reading $reading): JsonResponse
    {
        $zone = $reading->zone;
        $this->authorizeFarm($request, $zone->farm);

        $data = $request->validate($this->rules(partial: true), ReadingRules::messages());

        $changes = array_intersect_key($data, array_flip(['soil_moisture', 'temperature', 'humidity', 'water_applied_liters', 'notes']));

        $recordedAt = isset($data['recorded_at']) ? Carbon::parse($data['recorded_at'])->utc() : $reading->recorded_at;
        $measurementSent = isset($data['soil_moisture']) || isset($data['temperature']) || isset($data['humidity']);

        if ($measurementSent || isset($data['recorded_at'])) {
            $soilMoisture = $data['soil_moisture'] ?? $reading->soil_moisture;
            $temperature = $data['temperature'] ?? $reading->temperature;
            $humidity = $data['humidity'] ?? $reading->humidity;

            $reasons = $this->checker->suspiciousReasons($soilMoisture, $temperature, $humidity, $recordedAt);
            if ($reasons && ! $request->boolean('confirm_suspicious')) {
                return $this->suspiciousResponse($reasons);
            }

            $changes = [...$changes, 'recorded_at' => $recordedAt, ...$this->suspiciousColumns($reasons)];

            if ($measurementSent) {
                $changes = [
                    ...$changes,
                    ...$this->recommendations->evaluate($zone->crop, $zone, $soilMoisture, $temperature, $humidity),
                    'thresholds' => $zone->crop->thresholdSnapshot(),
                ];
            }
        }

        ActivityLog::recordUpdate(
            $request->user(), $reading, $changes, 'reading.updated',
            "Edited a reading of {$zone->name} ({$zone->farm->name})",
        );

        return response()->json(['reading' => $this->withDetails($reading)]);
    }

    public function destroy(Request $request, Reading $reading): JsonResponse
    {
        $zone = $reading->zone;
        $this->authorizeFarm($request, $zone->farm);

        $reading->delete();

        ActivityLog::record($request->user(), 'reading.deleted', "Deleted a reading of {$zone->name} ({$zone->farm->name})", $reading, [
            'recorded_at' => $reading->recorded_at->toIso8601String(),
            'soil_moisture' => $reading->soil_moisture,
            'temperature' => $reading->temperature,
            'humidity' => $reading->humidity,
        ]);

        return response()->json(['message' => 'Reading deleted.']);
    }

    /**
     * Shared by the zone and farm history: date range and status filters, newest first, 20 per page.
     */
    private function history(Request $request, Builder|Relation $query): JsonResponse
    {
        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'status' => ['nullable', Rule::enum(MoistureStatus::class)],
        ]);

        $page = $query
            ->with('enteredByUser:id,name')
            ->when($filters['from'] ?? null, fn ($query, $from) => $query->where('recorded_at', '>=', Carbon::parse($from)->utc()))
            ->when($filters['to'] ?? null, fn ($query, $to) => $query->where('recorded_at', '<=', Carbon::parse($to)->utc()))
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('moisture_status', $status))
            ->orderByDesc('recorded_at')
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json([
            'readings' => $page->items(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    private function rules(bool $partial): array
    {
        return [...ReadingRules::rules($partial), 'confirm_suspicious' => ['boolean']];
    }

    /**
     * 409 rather than 422: the values are valid, the Admin just has to confirm them.
     */
    private function suspiciousResponse(array $reasons): JsonResponse
    {
        return response()->json([
            'message' => 'This reading looks unusual. Check the values, then confirm to save it anyway.',
            'code' => 'suspicious_reading',
            'reasons' => $reasons,
        ], 409);
    }

    private function suspiciousColumns(array $reasons): array
    {
        return [
            'is_suspicious' => (bool) $reasons,
            'suspicious_reason' => $reasons ? implode(' ', $reasons) : null,
        ];
    }

    private function withDetails(Reading $reading): Reading
    {
        $reading->load('zone.crop', 'zone.farm', 'enteredByUser:id,name');
        $reading->zone->setAttribute('watering_estimate', $this->estimator->forZone($reading->zone));

        return $reading;
    }
}
