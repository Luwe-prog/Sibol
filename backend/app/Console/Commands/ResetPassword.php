<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ResetPassword extends Command
{
    protected $signature = 'sibol:reset-password {email : The email of the account to recover}';

    protected $description = 'Give an account a new temporary password. The way back in when a Super Admin is locked out.';

    public function handle(): int
    {
        $user = User::where('email', $this->argument('email'))->first();

        if (! $user) {
            $this->error('No account has that email.');

            return self::FAILURE;
        }

        $temporaryPassword = Str::password(10, symbols: false);

        // Also reactivates the account: a locked-out Super Admin may have been deactivated by mistake.
        $user->update(['password' => $temporaryPassword, 'must_change_password' => true, 'is_active' => true]);
        $user->tokens()->delete();

        ActivityLog::record(null, 'account.password_reset', "Reset the password of {$user->name} from the command line", $user);

        $this->info("Temporary password for {$user->name} ({$user->email}):");
        $this->line($temporaryPassword);
        $this->info('They will be asked to choose a new password at the next login.');

        return self::SUCCESS;
    }
}
