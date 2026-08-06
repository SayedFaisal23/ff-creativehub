<?php

namespace Database\Seeders;

use App\Http\Controllers\Api\StateController;
use App\Support\CreativeMonitorSeed;
use Illuminate\Database\Seeder;
use Illuminate\Http\Request;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        app(StateController::class)->update(Request::create('/api/state', 'PUT', CreativeMonitorSeed::state()));
    }
}
