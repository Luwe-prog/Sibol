<?php

namespace App\Enums;

enum MoistureStatus: string
{
    case TooDry = 'too_dry';
    case Optimal = 'optimal';
    case TooWet = 'too_wet';

    public function label(): string
    {
        return match ($this) {
            self::TooDry => 'Too Dry',
            self::Optimal => 'Optimal',
            self::TooWet => 'Too Wet',
        };
    }
}
