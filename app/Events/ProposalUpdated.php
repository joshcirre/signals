<?php

namespace App\Events;

use App\Models\Proposal;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProposalUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public Proposal $proposal,
        public int $userId,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('signals.user.'.$this->userId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'proposal.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->proposal->id,
            'type' => $this->proposal->type,
            'status' => $this->proposal->status,
            'payload' => $this->proposal->payload_json,
        ];
    }
}
