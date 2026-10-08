<?php

namespace App\Http\Controllers;

use App\Enums\Environment;
use App\Models\ActivityLog;
use App\Models\Crop;
use App\Models\Farm;
use App\Models\Zone;
use App\Services\WateringEstimator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ZoneController extends Controller
{
    public function store(Request $request, Farm $farm): JsonResponse
    {
        $this->authorizeFarm($request, $farm);
        abort_unless($farm->is_active, 422, 'This farm is inactive, so zones cannot be added to it.');

        $data = $this->validated($request, $farm);
        $this->ensureCropIsActive($data['crop_id']);

        $zone = $farm->zones()->create($data);

        ActivityLog::record($request->user(), 'zone.created', "Added the zone {$zone->name} to {$farm->name}", $zone);

        return response()->json(['zone' => $zone->load('crop', 'latestReading')], 201);
    }

    public function show(Request $request, Zone $zone, WateringEstimator $estimator): JsonResponse
    {
        $this->authorizeFarm($request, $zone->farm);

        $zone->load('farm', 'crop', 'latestReading');
        $zone->setAttribute('watering_estimate', $estimator->forZone($zone));

        return response()->json(['zone' => $zone]);
    }

    public function update(Request $request, Zone $zone): JsonResponse
    {
        $this->authorizeFarm($request, $zone->farm);

        $data = $this->validated($request, $zone->farm, $zone);

        // A zone may keep a crop that was retired later, but cannot switch to a retired one.
        if ((int) $data['crop_id'] !== $zone->crop_id) {
            $this->ensureCropIsActive($data['crop_id']);
        }

        ActivityLog::recordUpdate($request->user(), $zone, $data, 'zone.updated', "Edited the zone {$zone->name} ({$zone->farm->name})");

        return response()->json(['zone' => $zone->load('crop', 'latestReading')]);
    }

    private function validated(Request $request, Farm $farm, ?Zone $zone = null): array
    {
        return $request->validate([
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('zones', 'name')->where('farm_id', $farm->id)->ignore($zone?->id),
            ],
            'crop_id' => ['required', 'integer', 'exists:crops,id'],
            'environment' => ['required', Rule::enum(Environment::class)],
            'water_factor' => ['required', 'numeric', 'gt:0', 'max:1000'],
            'is_active' => ['boolean'],
        ], [
            'name.unique' => 'This farm already has a zone with that name.',
        ]);
    }

    private function ensureCropIsActive(int|string $cropId): void
    {
        if (! Crop::whereKey($cropId)->where('is_active', true)->exists()) {
            throw ValidationException::withMessages([
                'crop_id' => ['This crop is no longer available for new zones.'],
            ]);
        }
    }
}
