<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ActivityLogController extends Controller
{
    /** The first part of an action name: "crop" in "crop.updated". */
    public const AREAS = ['account', 'farm', 'crop', 'zone', 'reading'];

    /**
     * Who changed what, newest first.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'area' => ['nullable', Rule::in(self::AREAS)],
        ]);

        $page = ActivityLog::with('user:id,name')
            ->when($filters['area'] ?? null, fn ($query, $area) => $query->where('action', 'like', $area.'.%'))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(30);

        return response()->json([
            'entries' => $page->items(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'total' => $page->total(),
            ],
        ]);
    }
}
