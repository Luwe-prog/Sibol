<?php

namespace App\Http\Controllers;

use App\Models\Crop;
use Illuminate\Http\JsonResponse;

class CropController extends Controller
{
    /**
     * Active crops only: this feeds the crop picker when creating a zone.
     */
    public function index(): JsonResponse
    {
        return response()->json(['crops' => Crop::where('is_active', true)->orderBy('name')->get()]);
    }
}
