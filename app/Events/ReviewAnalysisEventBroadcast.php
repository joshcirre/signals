<?php

namespace App\Events;

use App\Models\ActionLog;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReviewAnalysisEventBroadcast implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public User $user,
        public ActionLog $event,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('signals.user.'.$this->user->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'review-analysis-event.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->event->id,
            'review_analysis_run_id' => $this->event->review_analysis_run_id,
            'actor_type' => $this->event->actor_type,
            'action' => $this->event->action,
            'target_type' => $this->event->target_type,
            'target_id' => $this->event->target_id,
            'metadata' => $this->event->metadata_json ?? [],
            'created_at' => $this->event->created_at?->toIso8601String(),
        ];
    }
}
