<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CropController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FarmController;
use App\Http\Controllers\ReadingController;
use App\Http\Controllers\ReadingImportController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SuperAdmin;
use App\Http\Controllers\ZoneController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Everything below needs a real (non-temporary) password.
    Route::middleware('password.changed')->group(function () {
        Route::middleware('role:super_admin')->prefix('super-admin')->group(function () {
            // "admins" covers every account, Admins and Super Admins alike.
            Route::get('/admins', [SuperAdmin\AdminAccountController::class, 'index']);
            Route::post('/admins', [SuperAdmin\AdminAccountController::class, 'store']);
            Route::put('/admins/{user}', [SuperAdmin\AdminAccountController::class, 'update']);
            Route::post('/admins/{user}/reset-password', [SuperAdmin\AdminAccountController::class, 'resetPassword']);
            Route::patch('/admins/{user}/active', [SuperAdmin\AdminAccountController::class, 'setActive']);

            Route::post('/farms', [SuperAdmin\FarmController::class, 'store']);
            Route::put('/farms/{farm}', [SuperAdmin\FarmController::class, 'update']);

            Route::get('/crops', [SuperAdmin\CropController::class, 'index']);
            Route::post('/crops', [SuperAdmin\CropController::class, 'store']);
            Route::put('/crops/{crop}', [SuperAdmin\CropController::class, 'update']);

            Route::get('/activity', [SuperAdmin\ActivityLogController::class, 'index']);
        });

        // Both roles. Admins are limited to their assigned farms inside each controller.
        Route::get('/dashboard', [DashboardController::class, 'index']);

        Route::get('/reports/water', [ReportController::class, 'water']);
        Route::get('/reports/water.csv', [ReportController::class, 'waterCsv']);
        Route::get('/reports/readings.csv', [ReportController::class, 'readingsCsv']);

        Route::get('/crops', [CropController::class, 'index']);

        Route::get('/farms', [FarmController::class, 'index']);
        Route::get('/farms/{farm}', [FarmController::class, 'show']);
        Route::get('/farms/{farm}/readings', [ReadingController::class, 'farmIndex']);

        Route::post('/farms/{farm}/zones', [ZoneController::class, 'store']);
        Route::get('/zones/{zone}', [ZoneController::class, 'show']);
        Route::put('/zones/{zone}', [ZoneController::class, 'update']);

        Route::get('/zones/{zone}/trend', [ReadingController::class, 'trend']);
        Route::get('/zones/{zone}/readings', [ReadingController::class, 'index']);
        Route::post('/zones/{zone}/readings', [ReadingController::class, 'store']);
        Route::post('/zones/{zone}/readings/import', [ReadingImportController::class, 'store']);
        Route::get('/readings/{reading}', [ReadingController::class, 'show']);
        Route::put('/readings/{reading}', [ReadingController::class, 'update']);
        Route::delete('/readings/{reading}', [ReadingController::class, 'destroy']);
    });
});
