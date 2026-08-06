<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'tags' => 'array',
        'usage_history' => 'array',
        'file_size' => 'integer',
        'created_at_date' => 'date',
    ];
}
