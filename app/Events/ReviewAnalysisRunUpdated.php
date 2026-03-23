<?php

namespace App\Events;

use App\Models\ReviewAnalysisRun;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReviewAnalysisRunUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public ReviewAnalysisRun $run,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('review-ops.user.'.$this->run->user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'review-analysis-run.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->run->id,
            'status' => $this->run->status,
            'summary' => $this->run->summary,
            'error_message' => $this->run->error_message,
            'requested_at' => $this->run->requested_at?->toIso8601String(),
            'started_at' => $this->run->started_at?->toIso8601String(),
            'completed_at' => $this->run->completed_at?->toIso8601String(),
        ];
    }
}
