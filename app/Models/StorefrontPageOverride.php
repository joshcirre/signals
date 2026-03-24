<?php

namespace App\Models;

use Database\Factories\StorefrontPageOverrideFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'product_id',
    'surface',
    'title',
    'arrow_source_json',
    'approved_by',
    'created_from_proposal_id',
    'created_from_run_id',
    'approved_at',
])]
class StorefrontPageOverride extends Model
{
    /** @use HasFactory<StorefrontPageOverrideFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'arrow_source_json' => 'array',
            'approved_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'created_from_proposal_id');
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(ReviewAnalysisRun::class, 'created_from_run_id');
    }
}
