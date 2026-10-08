<?php

namespace App\Http\Controllers;

use App\Models\Farm;
use Illuminate\Http\Request;

abstract class Controller
{
    /**
     * Admins may only touch farms they are assigned to; Super Admins may touch all.
     */
    protected function authorizeFarm(Request $request, Farm $farm): void
    {
        abort_unless($request->user()->canAccessFarm($farm), 403, 'You are not assigned to this farm.');
    }
}
