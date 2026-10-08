<?php

namespace App\Enums;

enum TempStatus: string
{
    case TooCold = 'too_cold';
    case Optimal = 'optimal';
    case TooHot = 'too_hot';

    public function label(): string
    {
        return match ($this) {
            self::TooCold => 'Too Cold',
            self::Optimal => 'Optimal',
            self::TooHot => 'Too Hot',
        };
    }
}
