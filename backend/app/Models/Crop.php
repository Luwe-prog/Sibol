<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Crop extends Model
{
    protected $fillable = [
        'name',
        'soil_moisture_min',
        'soil_moisture_max',
        'temp_min',
        'temp_max',
        'humidity_min',
        'humidity_max',
        'source_reference',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'soil_moisture_min' => 'float',
            'soil_moisture_max' => 'float',
            'temp_min' => 'float',
            'temp_max' => 'float',
            'humidity_min' => 'float',
            'humidity_max' => 'float',
            'is_active' => 'boolean',
        ];
    }

    /**
     * The ideal ranges as they are right now, stored with each reading that is judged against them.
     *
     * @return array<string, mixed>
     */
    public function thresholdSnapshot(): array
    {
        return [
            'crop' => $this->name,
            'soil_moisture_min' => $this->soil_moisture_min,
            'soil_moisture_max' => $this->soil_moisture_max,
            'temp_min' => $this->temp_min,
            'temp_max' => $this->temp_max,
            'humidity_min' => $this->humidity_min,
            'humidity_max' => $this->humidity_max,
        ];
    }

    public function zones(): HasMany
    {
        return $this->hasMany(Zone::class);
    }
}
