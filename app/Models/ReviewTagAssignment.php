<?php

namespace App\Models;

use Database\Factories\ReviewTagAssignmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['review_id', 'review_tag_id', 'confidence', 'assigned_by'])]
class ReviewTagAssignment extends Model
{
    /** @use HasFactory<ReviewTagAssignmentFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'confidence' => 'decimal:3',
        ];
    }

    public function review(): BelongsTo
    {
        return $this->belongsTo(Review::class);
    }

    public function reviewTag(): BelongsTo
    {
        return $this->belongsTo(ReviewTag::class);
    }
}
