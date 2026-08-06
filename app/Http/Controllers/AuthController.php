<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Api\StateController;
use App\Support\CreativeMonitorSeed;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController
{
    public function showLogin(): View|RedirectResponse
    {
        if (session()->has('creative_user')) {
            return redirect()->route('app');
        }

        if (DB::table('users')->count() === 0) {
            app(StateController::class)->update(Request::create('/api/state', 'PUT', CreativeMonitorSeed::state()));
        }

        $users = DB::table('users')
            ->select('id', 'name', 'title', 'department', 'role')
            ->orderByRaw("FIELD(role, 'Admin', 'Manager', 'Member', 'Freelancer', 'Limited')")
            ->orderBy('name')
            ->get();

        return view('login', ['users' => $users]);
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'user_id' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = DB::table('users')->where('id', $credentials['user_id'])->first();

        if (! $user || ! Hash::check($credentials['password'], (string) $user->password)) {
            return back()
                ->withErrors(['password' => 'The selected user and password do not match.'])
                ->withInput(['user_id' => $credentials['user_id']]);
        }

        $request->session()->regenerate();
        $defaultView = in_array($user->role, ['Admin', 'Manager', 'Director', 'Creative Manager', 'Project Manager', 'Coordinator'], true) ? 'admin' : 'editor';

        $request->session()->put('creative_user', [
            'id' => $user->id,
            'name' => $user->name,
            'title' => $user->title,
            'department' => $user->department,
            'role' => $user->role,
            'defaultView' => $defaultView,
        ]);
        $request->session()->put('creative_landing_view', $defaultView);

        return redirect()->route('app');
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget('creative_user');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
