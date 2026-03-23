<?php

namespace App\Models;

use Database\Factories\SignalsDeviceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'name', 'token_hash', 'is_active', 'last_seen_at'])]
class SignalsDevice extends Model
{
    /** @use HasFactory<SignalsDeviceFactory> */
    use HasFactory;

    protected $table = 'review_ops_devices';

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'last_seen_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function runs(): HasMany
    {
        return $this->hasMany(ReviewAnalysisRun::class);
    }
}
