<?php

namespace App\Events;

use App\Models\SignalsDevice;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SignalsHelperHeartbeatUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public SignalsDevice $device,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('signals.user.'.$this->device->user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'signals-helper.heartbeat.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->device->id,
            'name' => $this->device->name,
            'last_seen_at' => $this->device->last_seen_at?->toIso8601String(),
            'last_seen_at_human' => $this->device->last_seen_at?->diffForHumans(),
            'is_active' => $this->device->is_active,
        ];
    }
}
