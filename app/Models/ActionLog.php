<?php

namespace App\Models;

use Database\Factories\ActionLogFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'review_analysis_run_id',
    'actor_type',
    'actor_id',
    'action',
    'target_type',
    'target_id',
    'metadata_json',
])]
class ActionLog extends Model
{
    /** @use HasFactory<ActionLogFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'metadata_json' => 'array',
        ];
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(ReviewAnalysisRun::class, 'review_analysis_run_id');
    }
}
