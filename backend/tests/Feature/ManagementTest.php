<?php

namespace Tests\Feature;

use App\Models\Crop;
use App\Models\Farm;
use App\Models\User;
use Database\Seeders\CropSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CropSeeder::class);
        $this->superAdmin = User::factory()->superAdmin()->create();
        Sanctum::actingAs($this->superAdmin);
    }

    public function test_super_admin_creates_an_admin_who_must_change_the_temporary_password(): void
    {
        $farm = Farm::create(['name' => 'Rooftop Garden']);

        $response = $this->postJson('/api/super-admin/admins', [
            'name' => 'Ana Reyes',
            'email' => 'ana@sibol.test',
            'farm_ids' => [$farm->id],
        ])->assertCreated()->assertJsonPath('admin.farms.0.name', 'Rooftop Garden');

        $temporaryPassword = $response->json('temporary_password');
        $this->assertSame(10, strlen($temporaryPassword));

        $this->postJson('/api/login', ['email' => 'ana@sibol.test', 'password' => $temporaryPassword])
            ->assertOk()
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonPath('user.must_change_password', true);
    }

    public function test_reset_password_and_deactivate_sign_the_admin_out(): void
    {
        $admin = User::factory()->create();
        $admin->createToken('web');

        $this->postJson("/api/super-admin/admins/{$admin->id}/reset-password")
            ->assertOk()
            ->assertJsonStructure(['temporary_password']);

        $this->assertTrue($admin->fresh()->must_change_password);
        $this->assertSame(0, $admin->tokens()->count());

        $admin->createToken('web');
        $this->patchJson("/api/super-admin/admins/{$admin->id}/active", ['is_active' => false])->assertOk();

        $this->assertFalse($admin->fresh()->is_active);
        $this->assertSame(0, $admin->tokens()->count());
    }

    public function test_super_admin_cannot_lock_themselves_out(): void
    {
        $me = $this->superAdmin;

        $this->patchJson("/api/super-admin/admins/{$me->id}/active", ['is_active' => false])->assertStatus(422);
        $this->postJson("/api/super-admin/admins/{$me->id}/reset-password")->assertStatus(422);
        $this->putJson("/api/super-admin/admins/{$me->id}", ['name' => $me->name, 'email' => $me->email, 'role' => 'admin'])
            ->assertStatus(422)->assertJsonValidationErrors('role');

        $me->refresh();
        $this->assertTrue($me->is_active);
        $this->assertTrue($me->isSuperAdmin());
    }

    public function test_super_admin_can_create_and_manage_another_super_admin(): void
    {
        $farm = Farm::create(['name' => 'Rooftop Garden']);

        $response = $this->postJson('/api/super-admin/admins', [
            'name' => 'Second Boss',
            'email' => 'boss2@sibol.test',
            'role' => 'super_admin',
            // Ignored for a Super Admin, who sees every farm anyway.
            'farm_ids' => [$farm->id],
        ])->assertCreated()->assertJsonPath('admin.role', 'super_admin')->assertJsonCount(0, 'admin.farms');

        $id = $response->json('admin.id');

        $this->getJson('/api/super-admin/admins')->assertOk()->assertJsonCount(2, 'admins');

        // Another Super Admin can be demoted and deactivated; only your own account is protected.
        $this->putJson("/api/super-admin/admins/{$id}", ['name' => 'Second Boss', 'email' => 'boss2@sibol.test', 'role' => 'admin'])
            ->assertOk()->assertJsonPath('admin.role', 'admin');
        $this->patchJson("/api/super-admin/admins/{$id}/active", ['is_active' => false])->assertOk();
    }

    public function test_super_admin_creates_a_farm_and_assigns_admins(): void
    {
        $admin = User::factory()->create();

        $id = $this->postJson('/api/super-admin/farms', [
            'name' => 'Barangay Garden',
            'location' => 'Quezon City',
            'admin_ids' => [$admin->id],
        ])->assertCreated()->assertJsonPath('farm.users.0.id', $admin->id)->json('farm.id');

        $this->assertTrue($admin->canAccessFarm(Farm::find($id)));

        // Assigning a Super Admin is refused: they already see every farm.
        $this->putJson("/api/super-admin/farms/{$id}", [
            'name' => 'Barangay Garden',
            'admin_ids' => [$this->superAdmin->id],
        ])->assertStatus(422)->assertJsonValidationErrors('admin_ids.0');

        $this->putJson("/api/super-admin/farms/{$id}", ['name' => 'Barangay Garden', 'admin_ids' => []])->assertOk();
        $this->assertFalse($admin->canAccessFarm(Farm::find($id)));
    }

    public function test_crop_thresholds_must_have_min_below_max(): void
    {
        $crop = Crop::where('name', 'Basil')->first();

        $payload = [
            'name' => 'Basil',
            'soil_moisture_min' => 70, 'soil_moisture_max' => 50,
            'temp_min' => 20, 'temp_max' => 30,
            'humidity_min' => 40, 'humidity_max' => 60,
        ];

        $this->putJson("/api/super-admin/crops/{$crop->id}", $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors('soil_moisture_max');

        $this->putJson("/api/super-admin/crops/{$crop->id}", [...$payload, 'soil_moisture_min' => 45, 'soil_moisture_max' => 65])
            ->assertOk()
            ->assertJsonPath('crop.soil_moisture_min', 45);
    }

    public function test_admin_cannot_use_super_admin_endpoints(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/super-admin/admins')->assertForbidden();
        $this->postJson('/api/super-admin/farms', ['name' => 'X'])->assertForbidden();
        $this->postJson('/api/super-admin/crops', [])->assertForbidden();
        $this->putJson('/api/super-admin/crops/'.Crop::first()->id, [])->assertForbidden();
    }

    public function test_admin_manages_zones_on_an_assigned_farm_with_active_crops_only(): void
    {
        $admin = User::factory()->create();
        $farm = Farm::create(['name' => 'Rooftop Garden']);
        $farm->users()->attach($admin);
        Sanctum::actingAs($admin);

        $basil = Crop::where('name', 'Basil')->first();
        $retired = Crop::where('name', 'Tomato')->first();
        $retired->update(['is_active' => false]);

        $this->getJson('/api/crops')->assertOk()->assertJsonCount(5, 'crops');

        $zone = ['name' => 'Bed A', 'crop_id' => $basil->id, 'environment' => 'rooftop', 'water_factor' => 0.8];

        $id = $this->postJson("/api/farms/{$farm->id}/zones", $zone)
            ->assertCreated()
            ->assertJsonPath('zone.crop.name', 'Basil')
            ->json('zone.id');

        // Same name twice in one farm, a retired crop, and a bad environment are all refused.
        $this->postJson("/api/farms/{$farm->id}/zones", $zone)->assertStatus(422)->assertJsonValidationErrors('name');
        $this->postJson("/api/farms/{$farm->id}/zones", [...$zone, 'name' => 'Bed B', 'crop_id' => $retired->id])
            ->assertStatus(422)->assertJsonValidationErrors('crop_id');
        $this->postJson("/api/farms/{$farm->id}/zones", [...$zone, 'name' => 'Bed C', 'environment' => 'garden'])
            ->assertStatus(422)->assertJsonValidationErrors('environment');

        $this->putJson("/api/zones/{$id}", [...$zone, 'water_factor' => 1.2, 'is_active' => false])
            ->assertOk()
            ->assertJsonPath('zone.water_factor', 1.2)
            ->assertJsonPath('zone.is_active', false);

        $this->getJson("/api/farms/{$farm->id}")->assertOk()->assertJsonCount(1, 'farm.zones');
    }
}
