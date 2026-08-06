<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('creative:seed', function (): int {
    $this->call('db:seed');

    return self::SUCCESS;
})->purpose('Seed Creative Monitor demo data');
