<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\View\View;

class AppController
{
    public function __invoke(): View
    {
        return view('app', [
            'authUser' => session('creative_user'),
        ]);
    }
}
