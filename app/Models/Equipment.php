<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    protected $table = 'equipment';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'booking_history' => 'array',
        'return_date' => 'date',
        'maintenance_date' => 'date',
        'warranty_date' => 'date',
        'purchase_date' => 'date',
        'replacement_date' => 'date',
    ];
}
