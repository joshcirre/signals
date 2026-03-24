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

    private const CONTENT_LIMIT = 1800;

    private const MESSAGE_LIMIT = 600;

    private const QUERY_LIMIT = 240;

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
        $metadata = $this->broadcastMetadata();

        return [
            'id' => $this->event->id,
            'review_analysis_run_id' => $this->event->review_analysis_run_id,
            'actor_type' => $this->event->actor_type,
            'action' => $this->event->action,
            'target_type' => $this->event->target_type,
            'target_id' => $this->event->target_id,
            'kind' => $this->event->metadata_json['kind'] ?? null,
            'content' => $this->truncate(
                $this->event->metadata_json['content'] ??
                    ($this->event->metadata_json['message'] ?? null),
                self::CONTENT_LIMIT,
            ),
            'tool_id' => $this->event->metadata_json['tool_id'] ?? null,
            'tool_name' => $this->event->metadata_json['tool_name'] ?? null,
            'item_id' => $this->event->metadata_json['item_id'] ?? null,
            'is_error' => (bool) ($this->event->metadata_json['is_error'] ?? false),
            'metadata' => $metadata,
            'created_at' => $this->event->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function broadcastMetadata(): array
    {
        $metadata = is_array($this->event->metadata_json)
            ? $this->event->metadata_json
            : [];

        $broadcastable = array_filter([
            'message' => $this->truncate($metadata['message'] ?? null, self::MESSAGE_LIMIT),
            'server_name' => $metadata['server_name'] ?? null,
            'tool_name' => $metadata['tool_name'] ?? null,
            'status' => $metadata['status'] ?? null,
            'success' => $metadata['success'] ?? null,
            'exit_code' => $metadata['exit_code'] ?? null,
            'thread_id' => $metadata['thread_id'] ?? null,
            'turn_id' => $metadata['turn_id'] ?? null,
            'path' => $metadata['path'] ?? null,
            'change_kind' => $metadata['change_kind'] ?? null,
            'query' => $this->truncate($metadata['query'] ?? null, self::QUERY_LIMIT),
            'command' => $this->truncate($metadata['command'] ?? null, self::QUERY_LIMIT),
        ], static fn (mixed $value): bool => $value !== null && $value !== '');

        $omittedKeys = array_diff(
            array_keys($metadata),
            [
                'message',
                'server_name',
                'tool_name',
                'status',
                'success',
                'exit_code',
                'thread_id',
                'turn_id',
                'path',
                'change_kind',
                'query',
                'command',
                'kind',
                'content',
                'tool_id',
                'item_id',
                'is_error',
            ],
        );

        if ($omittedKeys !== []) {
            $broadcastable['details_omitted'] = true;
        }

        return $broadcastable;
    }

    private function truncate(mixed $value, int $limit): ?string
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        if (mb_strlen($value) <= $limit) {
            return $value;
        }

        return mb_substr($value, 0, $limit - 3).'...';
    }
}
