<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'checklist' => 'array',
        'attachments' => 'array',
        'comments' => 'array',
        'dependencies' => 'array',
        'due_date' => 'date',
        'start_date' => 'date',
        'completion_date' => 'date',
    ];
}
