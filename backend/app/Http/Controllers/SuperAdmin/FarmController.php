<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Farm;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FarmController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $farm = Farm::create($data);
        $farm->users()->sync($data['admin_ids'] ?? []);

        ActivityLog::record($request->user(), 'farm.created', "Created the farm {$farm->name}", $farm);

        return response()->json(['farm' => $farm->load('users:id,name,email')], 201);
    }

    public function update(Request $request, Farm $farm): JsonResponse
    {
        $data = $this->validated($request);

        $extra = [];
        if (array_key_exists('admin_ids', $data)) {
            $synced = $farm->users()->sync($data['admin_ids']);
            $extra = array_filter(['admins_added' => $synced['attached'], 'admins_removed' => $synced['detached']]);
        }

        ActivityLog::recordUpdate($request->user(), $farm, $data, 'farm.updated', "Edited the farm {$farm->name}", $extra);

        return response()->json(['farm' => $farm->load('users:id,name,email')]);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['boolean'],
            'admin_ids' => ['array'],
            // Only Admin accounts can be assigned; a Super Admin already sees every farm.
            'admin_ids.*' => ['integer', Rule::exists('users', 'id')->where('role', UserRole::Admin->value)],
        ]);
    }
}
