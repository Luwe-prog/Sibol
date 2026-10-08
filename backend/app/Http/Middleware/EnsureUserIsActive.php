<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Reject requests from deactivated accounts, even if their token is still valid.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->is_active) {
            return response()->json([
                'message' => 'This account has been deactivated.',
                'code' => 'account_deactivated',
            ], 403);
        }

        return $next($request);
    }
}
