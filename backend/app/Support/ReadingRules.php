<?php

namespace App\Support;

/**
 * Validation rules for a reading, shared by the entry form and the CSV import
 * (PROJECT_SCOPE.md section 2: impossible values are rejected).
 */
class ReadingRules
{
    /**
     * @param  bool  $partial  True for an edit that may send only some fields.
     */
    public static function rules(bool $partial = false): array
    {
        $required = $partial ? ['sometimes', 'required'] : ['required'];

        return [
            'soil_moisture' => [...$required, 'numeric', 'between:0,100'],
            'temperature' => [...$required, 'numeric', 'between:0,60'],
            'humidity' => [...$required, 'numeric', 'between:0,100'],
            // Backdating is allowed; the future is not. Five minutes of slack covers a phone clock that runs fast.
            'recorded_at' => ['nullable', 'date', 'before_or_equal:'.now()->addMinutes(5)->toIso8601String()],
            'water_applied_liters' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public static function messages(): array
    {
        return [
            'soil_moisture.between' => 'Soil moisture must be between 0 and 100%.',
            'temperature.between' => 'Temperature must be between 0 and 60 °C.',
            'humidity.between' => 'Humidity must be between 0 and 100%.',
            'recorded_at.before_or_equal' => 'The reading time cannot be in the future.',
            'water_applied_liters.min' => 'Water applied cannot be negative.',
        ];
    }
}
