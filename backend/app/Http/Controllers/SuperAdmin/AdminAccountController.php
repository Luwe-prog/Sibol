<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Manages every account: Admins and Super Admins.
 *
 * A Super Admin cannot deactivate, demote, or reset their own account here, which also
 * guarantees there is always at least one active Super Admin.
 */
class AdminAccountController extends Controller
{
    public function index(): JsonResponse
    {
        $accounts = User::with('farms:id,name')
            ->orderByRaw('role = ? desc', [UserRole::SuperAdmin->value])
            ->orderBy('name')
            ->get();

        return response()->json(['admins' => $accounts]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => [Rule::enum(UserRole::class)],
            'farm_ids' => ['array'],
            'farm_ids.*' => ['integer', 'exists:farms,id'],
        ]);

        $role = UserRole::from($data['role'] ?? UserRole::Admin->value);
        $temporaryPassword = $this->temporaryPassword();

        $account = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $temporaryPassword,
            'role' => $role,
            'is_active' => true,
            'must_change_password' => true,
        ]);
        $account->farms()->sync($this->farmIdsFor($role, $data['farm_ids'] ?? []));

        ActivityLog::record($request->user(), 'account.created', "Created the {$this->roleName($role)} account {$account->name} ({$account->email})", $account);

        // The temporary password is shown once here and never again.
        return response()->json([
            'admin' => $account->load('farms:id,name'),
            'temporary_password' => $temporaryPassword,
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => [Rule::enum(UserRole::class)],
            'farm_ids' => ['array'],
            'farm_ids.*' => ['integer', 'exists:farms,id'],
        ]);

        $role = UserRole::from($data['role'] ?? $user->role->value);

        if ($user->is($request->user()) && $role !== UserRole::SuperAdmin) {
            throw ValidationException::withMessages(['role' => ['You cannot remove your own Super Admin role.']]);
        }

        $extra = [];
        if (array_key_exists('farm_ids', $data) || $role === UserRole::SuperAdmin) {
            $synced = $user->farms()->sync($this->farmIdsFor($role, $data['farm_ids'] ?? []));
            $extra = array_filter(['farms_added' => $synced['attached'], 'farms_removed' => $synced['detached']]);
        }

        ActivityLog::recordUpdate(
            $request->user(), $user,
            ['name' => $data['name'], 'email' => $data['email'], 'role' => $role->value],
            'account.updated', "Edited the account {$user->name}", $extra,
        );

        return response()->json(['admin' => $user->load('farms:id,name')]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $this->ensureNotSelf($request, $user, 'Use "Change password" to change your own password.');

        $temporaryPassword = $this->temporaryPassword();

        $user->update(['password' => $temporaryPassword, 'must_change_password' => true]);
        $user->tokens()->delete();

        ActivityLog::record($request->user(), 'account.password_reset', "Reset the password of {$user->name}", $user);

        return response()->json([
            'admin' => $user->load('farms:id,name'),
            'temporary_password' => $temporaryPassword,
        ]);
    }

    public function setActive(Request $request, User $user): JsonResponse
    {
        $data = $request->validate(['is_active' => ['required', 'boolean']]);

        if (! $data['is_active']) {
            $this->ensureNotSelf($request, $user, 'You cannot deactivate your own account.');
        }

        if ($user->is_active !== $data['is_active']) {
            $user->update(['is_active' => $data['is_active']]);

            ActivityLog::record(
                $request->user(),
                $user->is_active ? 'account.reactivated' : 'account.deactivated',
                ($user->is_active ? 'Reactivated' : 'Deactivated')." the account {$user->name}",
                $user,
            );
        }

        if (! $user->is_active) {
            $user->tokens()->delete();
        }

        return response()->json(['admin' => $user->load('farms:id,name')]);
    }

    private function ensureNotSelf(Request $request, User $user, string $message): void
    {
        abort_if($user->is($request->user()), 422, $message);
    }

    /**
     * Farm assignments only apply to Admins: a Super Admin already sees every farm.
     */
    private function farmIdsFor(UserRole $role, array $farmIds): array
    {
        return $role === UserRole::Admin ? $farmIds : [];
    }

    private function roleName(UserRole $role): string
    {
        return $role === UserRole::SuperAdmin ? 'Super Admin' : 'Admin';
    }

    private function temporaryPassword(): string
    {
        return Str::password(10, symbols: false);
    }
}
