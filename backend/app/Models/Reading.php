<?php

namespace App\Models;

use App\Enums\HumidityStatus;
use App\Enums\MoistureStatus;
use App\Enums\ReadingSource;
use App\Enums\TempStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reading extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'zone_id',
        'entered_by',
        'recorded_at',
        'soil_moisture',
        'temperature',
        'humidity',
        'water_applied_liters',
        'notes',
        'source',
        'is_suspicious',
        'suspicious_reason',
        'moisture_status',
        'temp_status',
        'humidity_status',
        'thresholds',
        'recommended_liters',
        'recommendation_text',
    ];

    protected function casts(): array
    {
        return [
            'recorded_at' => 'datetime',
            'soil_moisture' => 'float',
            'temperature' => 'float',
            'humidity' => 'float',
            'water_applied_liters' => 'float',
            'source' => ReadingSource::class,
            'is_suspicious' => 'boolean',
            'moisture_status' => MoistureStatus::class,
            'temp_status' => TempStatus::class,
            'humidity_status' => HumidityStatus::class,
            'thresholds' => 'array',
            'recommended_liters' => 'float',
        ];
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    // Not named enteredBy: that would serialize to "entered_by" and hide the id column in JSON.
    public function enteredByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entered_by');
    }
}
