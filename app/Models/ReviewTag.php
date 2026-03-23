<?php

namespace App\Models;

use Database\Factories\ReviewTagFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'normalized_name', 'visibility'])]
class ReviewTag extends Model
{
    /** @use HasFactory<ReviewTagFactory> */
    use HasFactory;

    public function assignments(): HasMany
    {
        return $this->hasMany(ReviewTagAssignment::class);
    }
}
