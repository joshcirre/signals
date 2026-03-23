<?php

namespace App\Models;

use Database\Factories\ReviewAnalysisRunFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'review_ops_device_id',
    'status',
    'prompt',
    'summary',
    'error_message',
    'requested_at',
    'started_at',
    'completed_at',
])]
class ReviewAnalysisRun extends Model
{
    /** @use HasFactory<ReviewAnalysisRunFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(ReviewOpsDevice::class, 'review_ops_device_id');
    }

    public function proposals(): HasMany
    {
        return $this->hasMany(Proposal::class);
    }

    public function actionLogs(): HasMany
    {
        return $this->hasMany(ActionLog::class);
    }
}
