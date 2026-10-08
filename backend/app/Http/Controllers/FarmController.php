<?php

namespace App\Http\Controllers;

use App\Models\Farm;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FarmController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $farms = $user->accessibleFarms()
            ->withCount('zones')
            ->when($user->isSuperAdmin(), fn ($query) => $query->with('users:id,name,email'))
            ->orderBy('name')
            ->get();

        return response()->json(['farms' => $farms]);
    }

    public function show(Request $request, Farm $farm): JsonResponse
    {
        $this->authorizeFarm($request, $farm);

        $farm->load(['zones' => fn ($query) => $query->orderBy('name'), 'zones.crop', 'zones.latestReading']);

        if ($request->user()->isSuperAdmin()) {
            $farm->load('users:id,name,email');
        }

        return response()->json(['farm' => $farm]);
    }
}
