<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'must_change_password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
        ];
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === UserRole::SuperAdmin;
    }

    /**
     * Farms this Admin is assigned to. Super Admins see all farms regardless.
     */
    public function farms(): BelongsToMany
    {
        return $this->belongsToMany(Farm::class)->withTimestamps();
    }

    public function canAccessFarm(Farm $farm): bool
    {
        return $this->isSuperAdmin() || $this->farms()->whereKey($farm->id)->exists();
    }

    /**
     * Query for the farms this user may see: all of them for a Super Admin, assigned ones for an Admin.
     */
    public function accessibleFarms(): Builder
    {
        return $this->isSuperAdmin()
            ? Farm::query()
            : Farm::whereHas('users', fn (Builder $query) => $query->whereKey($this->id));
    }

    public function readings(): HasMany
    {
        return $this->hasMany(Reading::class, 'entered_by');
    }
}
