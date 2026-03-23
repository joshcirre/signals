<?php

namespace App\Models;

use Database\Factories\ReviewFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'product_id',
    'author_name',
    'rating',
    'title',
    'body',
    'source',
    'reviewed_at',
    'processed_at',
    'response_draft',
    'response_draft_status',
    'response_draft_approved_at',
])]
class Review extends Model
{
    /** @use HasFactory<ReviewFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
            'processed_at' => 'datetime',
            'response_draft_approved_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function tagAssignments(): HasMany
    {
        return $this->hasMany(ReviewTagAssignment::class);
    }
}
