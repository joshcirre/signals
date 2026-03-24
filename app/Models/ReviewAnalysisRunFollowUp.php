<?php

namespace App\Models;

use Database\Factories\ReviewAnalysisRunFollowUpFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'review_analysis_run_id',
    'requested_by',
    'content',
    'status',
    'summary',
    'error_message',
    'requested_at',
    'started_at',
    'completed_at',
])]
class ReviewAnalysisRunFollowUp extends Model
{
    /** @use HasFactory<ReviewAnalysisRunFollowUpFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(ReviewAnalysisRun::class, 'review_analysis_run_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
