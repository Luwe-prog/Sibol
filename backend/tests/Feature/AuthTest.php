<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Stand-in routes for the phase 2 groups, so the middleware stack can be tested now.
        Route::middleware(['api', 'auth:sanctum', 'active', 'password.changed'])->prefix('api/_test')->group(function () {
            Route::get('/any-role', fn () => response()->json(['ok' => true]));
            Route::get('/super-admin-only', fn () => response()->json(['ok' => true]))->middleware('role:super_admin');
        });
    }

    public function test_login_returns_a_token_and_the_user(): void
    {
        $user = User::factory()->superAdmin()->create();

        $response = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password']);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role', 'must_change_password']])
            ->assertJsonPath('user.role', 'super_admin');

        $this->withToken($response->json('token'))->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_login_rejects_a_wrong_password(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'wrong'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_deactivated_account_cannot_log_in(): void
    {
        $user = User::factory()->inactive()->create();

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])
            ->assertStatus(403)
            ->assertJsonPath('code', 'account_deactivated');
    }

    public function test_deactivated_account_is_rejected_even_with_a_valid_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('web')->plainTextToken;
        $user->update(['is_active' => false]);

        $this->withToken($token)->getJson('/api/me')
            ->assertStatus(403)
            ->assertJsonPath('code', 'account_deactivated');
    }

    public function test_protected_routes_need_a_token(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
    }

    public function test_logout_revokes_the_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('web')->plainTextToken;

        $this->withToken($token)->postJson('/api/logout')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_temporary_password_blocks_the_app_until_changed(): void
    {
        $user = User::factory()->temporaryPassword()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/_test/any-role')
            ->assertStatus(403)
            ->assertJsonPath('code', 'password_change_required');

        // /me stays reachable so the frontend can tell it must show the change-password screen.
        $this->getJson('/api/me')->assertOk()->assertJsonPath('user.must_change_password', true);
    }

    public function test_changing_the_password_unlocks_the_app(): void
    {
        $user = User::factory()->temporaryPassword()->create();
        $token = $user->createToken('web')->plainTextToken;

        $this->withToken($token)->postJson('/api/change-password', [
            'current_password' => 'password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertOk()->assertJsonPath('user.must_change_password', false);

        $user->refresh();
        $this->assertFalse($user->must_change_password);
        $this->assertTrue(Hash::check('new-password-123', $user->password));

        $this->withToken($token)->getJson('/api/_test/any-role')->assertOk();
    }

    public function test_change_password_requires_the_current_password(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/change-password', [
            'current_password' => 'wrong',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertStatus(422)->assertJsonValidationErrors('current_password');
    }

    public function test_admin_cannot_reach_super_admin_routes(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/_test/any-role')->assertOk();
        $this->getJson('/api/_test/super-admin-only')
            ->assertStatus(403)
            ->assertJsonPath('code', 'forbidden');
    }

    public function test_super_admin_can_reach_super_admin_routes(): void
    {
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->getJson('/api/_test/super-admin-only')->assertOk();
    }
}
