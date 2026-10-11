<?php

use Illuminate\Support\Facades\Route;

// The backend only serves the API (routes/api.php). The pages people use are in frontend/.
Route::get('/', function () {
    return response()->json([
        'name' => 'Sibol API',
        'message' => 'The API is running. Open the frontend (http://localhost:5173 by default) to use Sibol.',
    ]);
});
