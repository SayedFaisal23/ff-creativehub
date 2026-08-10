<?php

namespace App\Http\Controllers;

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
            return view('setup');
        }

        $users = DB::table('users')
            ->select('name', 'email', 'role')
            ->orderByRaw("CASE WHEN role = 'Admin' THEN 0 WHEN role IN ('Creative Manager', 'Coordinator') THEN 1 ELSE 2 END")
            ->orderBy('name')
            ->get();

        return view('login', ['users' => $users]);
    }

    public function createFirstAdmin(Request $request): RedirectResponse
    {
        if (DB::table('users')->count() > 0) {
            return redirect()->route('login');
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        DB::table('departments')->updateOrInsert(
            ['name' => 'Creative Operations'],
            ['created_at' => now(), 'updated_at' => now()],
        );

        DB::table('users')->insert([
            'id' => 'admin-1',
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'title' => 'System Admin',
            'department' => 'Creative Operations',
            'role' => 'Admin',
            'utilization' => 0,
            'skills' => '[]',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->route('login')->with('status', 'Admin account created. Sign in to continue.');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = DB::table('users')->where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], (string) $user->password)) {
            return back()
                ->withErrors(['email' => 'The email and password do not match.'])
                ->withInput(['email' => $credentials['email']]);
        }

        $request->session()->regenerate();
        $defaultView = $this->defaultViewForRole((string) $user->role);

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

    private function defaultViewForRole(string $role): string
    {
        return match ($role) {
            'Admin' => 'admin',
            'Creative Manager', 'Coordinator' => 'flow',
            'QC' => 'qc',
            'Client' => 'approvals',
            default => 'editor',
        };
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget('creative_user');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
