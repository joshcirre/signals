<?php

use App\Events\ReviewAnalysisEventBroadcast;
use App\Events\ReviewAnalysisRunUpdated;
use App\Events\SignalsHelperHeartbeatUpdated;
use App\Models\ActionLog;
use App\Models\ReviewAnalysisRun;
use App\Models\SignalsDevice;
use Carbon\CarbonImmutable;

test('review analysis run updated broadcast uses the private user channel contract', function (): void {
    $run = ReviewAnalysisRun::factory()->create([
        'status' => 'running',
        'summary' => 'Codex is working through the queued Signals run.',
        'codex_thread_id' => 'thread_123',
        'codex_session_status' => 'active',
    ]);

    $event = new ReviewAnalysisRunUpdated($run);

    expect($event->broadcastAs())->toBe('review-analysis-run.updated')
        ->and($event->broadcastOn())->toHaveCount(1)
        ->and($event->broadcastOn()[0]->name)->toBe('private-signals.user.'.$run->user_id)
        ->and($event->broadcastWith())->toMatchArray([
            'id' => $run->id,
            'status' => 'running',
            'summary' => 'Codex is working through the queued Signals run.',
            'codex_thread_id' => 'thread_123',
            'codex_session_status' => 'active',
        ]);
});

test('review analysis event broadcast uses the private user channel contract', function (): void {
    $eventLog = ActionLog::factory()->create([
        'action' => 'mcp.tool.completed',
        'metadata_json' => [
            'message' => 'Completed a Signals MCP tool call.',
            'tool_name' => 'mcp__signals__log_action',
        ],
    ]);

    $event = new ReviewAnalysisEventBroadcast($eventLog->run->user, $eventLog);

    expect($event->broadcastAs())->toBe('review-analysis-event.created')
        ->and($event->broadcastOn())->toHaveCount(1)
        ->and($event->broadcastOn()[0]->name)->toBe('private-signals.user.'.$eventLog->run->user_id)
        ->and($event->broadcastWith())->toMatchArray([
            'id' => $eventLog->id,
            'review_analysis_run_id' => $eventLog->review_analysis_run_id,
            'action' => 'mcp.tool.completed',
            'kind' => null,
            'content' => 'Completed a Signals MCP tool call.',
            'tool_id' => null,
            'tool_name' => 'mcp__signals__log_action',
            'item_id' => null,
            'is_error' => false,
            'metadata' => [
                'message' => 'Completed a Signals MCP tool call.',
                'tool_name' => 'mcp__signals__log_action',
            ],
        ]);
});

test('signals helper heartbeat broadcast uses the private user channel contract', function (): void {
    CarbonImmutable::setTestNow('2026-03-23 06:05:15');

    $device = SignalsDevice::factory()->create([
        'name' => 'Signals Helper',
        'last_seen_at' => now()->subMinute(),
    ]);

    $event = new SignalsHelperHeartbeatUpdated($device);

    expect($event->broadcastAs())->toBe('signals-helper.heartbeat.updated')
        ->and($event->broadcastOn())->toHaveCount(1)
        ->and($event->broadcastOn()[0]->name)->toBe('private-signals.user.'.$device->user_id)
        ->and($event->broadcastWith())->toMatchArray([
            'id' => $device->id,
            'name' => 'Signals Helper',
            'last_seen_at_human' => '1 minute ago',
            'is_active' => $device->is_active,
        ])
        ->and($event->broadcastWith()['last_seen_at'])->not->toBeNull();

    CarbonImmutable::setTestNow();
});
