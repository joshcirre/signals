<?php

namespace App\Models;

use Database\Factories\ReviewClusterFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['product_id', 'title', 'summary', 'severity', 'review_count'])]
class ReviewCluster extends Model
{
    /** @use HasFactory<ReviewClusterFactory> */
    use HasFactory;

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
