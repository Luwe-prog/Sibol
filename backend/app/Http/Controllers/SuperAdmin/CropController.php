<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Crop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CropController extends Controller
{
    /**
     * The full library, including inactive crops.
     */
    public function index(): JsonResponse
    {
        return response()->json(['crops' => Crop::withCount('zones')->orderBy('name')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $crop = Crop::create($this->validated($request));

        ActivityLog::record($request->user(), 'crop.created', "Added the crop {$crop->name}", $crop, ['after' => $crop->thresholdSnapshot()]);

        return response()->json(['crop' => $crop], 201);
    }

    /**
     * Editing thresholds does not change past readings: each reading stores its own status.
     */
    public function update(Request $request, Crop $crop): JsonResponse
    {
        ActivityLog::recordUpdate($request->user(), $crop, $this->validated($request, $crop), 'crop.updated', "Edited the crop {$crop->name}");

        return response()->json(['crop' => $crop]);
    }

    private function validated(Request $request, ?Crop $crop = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('crops', 'name')->ignore($crop?->id)],
            'soil_moisture_min' => ['required', 'numeric', 'between:0,100'],
            'soil_moisture_max' => ['required', 'numeric', 'between:0,100', 'gt:soil_moisture_min'],
            'temp_min' => ['required', 'numeric', 'between:0,60'],
            'temp_max' => ['required', 'numeric', 'between:0,60', 'gt:temp_min'],
            'humidity_min' => ['required', 'numeric', 'between:0,100'],
            'humidity_max' => ['required', 'numeric', 'between:0,100', 'gt:humidity_min'],
            'source_reference' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);
    }
}
