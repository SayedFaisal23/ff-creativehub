<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'assigned_team_members' => 'array',
        'tags' => 'array',
        'categories' => 'array',
        'milestones' => 'array',
        'deliverables' => 'array',
        'creative_brief' => 'array',
        'start_date' => 'date',
        'deadline' => 'date',
        'expected_completion' => 'date',
        'actual_completion' => 'date',
    ];
}
