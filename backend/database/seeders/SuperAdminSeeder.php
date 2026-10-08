<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    /**
     * Create the first Super Admin. Credentials come from .env so they are not hardcoded.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => env('SUPER_ADMIN_EMAIL', 'superadmin@sibol.test')],
            [
                'name' => env('SUPER_ADMIN_NAME', 'Super Admin'),
                'password' => env('SUPER_ADMIN_PASSWORD', 'password'),
                'role' => UserRole::SuperAdmin,
                'is_active' => true,
                'must_change_password' => false,
            ],
        );
    }
}
