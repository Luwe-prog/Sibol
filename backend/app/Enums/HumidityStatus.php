<?php

namespace App\Enums;

enum HumidityStatus: string
{
    case TooLow = 'too_low';
    case Optimal = 'optimal';
    case TooHigh = 'too_high';

    public function label(): string
    {
        return match ($this) {
            self::TooLow => 'Too Low',
            self::Optimal => 'Optimal',
            self::TooHigh => 'Too High',
        };
    }
}
