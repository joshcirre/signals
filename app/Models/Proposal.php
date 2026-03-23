<?php

namespace App\Models;

use Database\Factories\ProposalFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'review_analysis_run_id',
    'type',
    'status',
    'target_type',
    'target_id',
    'payload_json',
    'rationale',
    'confidence',
    'created_by',
    'approved_by',
    'approved_at',
    'applied_at',
])]
class Proposal extends Model
{
    /** @use HasFactory<ProposalFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'payload_json' => 'array',
            'confidence' => 'decimal:3',
            'approved_at' => 'datetime',
            'applied_at' => 'datetime',
        ];
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(ReviewAnalysisRun::class, 'review_analysis_run_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
