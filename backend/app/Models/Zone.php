<?php

namespace App\Models;

use App\Enums\Environment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Zone extends Model
{
    /**
     * A zone with no reading for this many days shows a stale data warning.
     */
    public const STALE_AFTER_DAYS = 2;

    protected $fillable = [
        'farm_id',
        'crop_id',
        'name',
        'environment',
        'water_factor',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'environment' => Environment::class,
            'water_factor' => 'float',
            'is_active' => 'boolean',
        ];
    }

    public function farm(): BelongsTo
    {
        return $this->belongsTo(Farm::class);
    }

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    public function readings(): HasMany
    {
        return $this->hasMany(Reading::class);
    }

    public function latestReading(): HasOne
    {
        return $this->hasOne(Reading::class)->latestOfMany('recorded_at');
    }
}
