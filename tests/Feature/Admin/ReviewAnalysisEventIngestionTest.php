<?php

use App\Models\ActionLog;
use App\Models\ReviewAnalysisRun;
use App\Models\SignalsDevice;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('device stream ingestion preserves structured metadata for streamed codex updates', function (): void {
    $admin = User::factory()->create();
    $plainTextToken = 'signals-secret-token';
    $device = SignalsDevice::factory()->create([
        'user_id' => $admin->id,
        'token_hash' => Hash::make($plainTextToken),
    ]);
    $run = ReviewAnalysisRun::factory()->create([
        'user_id' => $admin->id,
        'review_ops_device_id' => $device->id,
        'status' => 'running',
    ]);

    $this->withHeader('Authorization', 'Bearer '.$plainTextToken)
        ->postJson(route('api.device.runs.stream', $run), [
            'action' => 'mcp.server.ready',
            'message' => 'Codex discovered the Signals MCP server.',
            'content' => 'Codex discovered the Signals MCP server.',
            'kind' => 'status',
            'tool_id' => 'tool-123',
            'tool_name' => 'mcp__signals__list_reviews',
            'is_error' => false,
            'metadata' => [
                'server_name' => 'signals',
                'resource_count' => 2,
                'tool_names' => [
                    'mcp__signals__list_products',
                    'mcp__signals__list_reviews',
                ],
            ],
        ])
        ->assertSuccessful();

    $event = ActionLog::query()->latest('id')->first();

    expect($event)->not->toBeNull()
        ->and($event?->action)->toBe('mcp.server.ready')
        ->and($event?->metadata_json)->toMatchArray([
            'message' => 'Codex discovered the Signals MCP server.',
            'content' => 'Codex discovered the Signals MCP server.',
            'kind' => 'status',
            'tool_id' => 'tool-123',
            'tool_name' => 'mcp__signals__list_reviews',
            'is_error' => false,
            'server_name' => 'signals',
            'resource_count' => 2,
            'tool_names' => [
                'mcp__signals__list_products',
                'mcp__signals__list_reviews',
            ],
        ]);
});

test('device stream ingestion stores assistant text deltas with item ids', function (): void {
    $admin = User::factory()->create();
    $plainTextToken = 'signals-secret-token';
    $device = SignalsDevice::factory()->create([
        'user_id' => $admin->id,
        'token_hash' => Hash::make($plainTextToken),
    ]);
    $run = ReviewAnalysisRun::factory()->create([
        'user_id' => $admin->id,
        'review_ops_device_id' => $device->id,
        'status' => 'running',
    ]);

    $this->withHeader('Authorization', 'Bearer '.$plainTextToken)
        ->postJson(route('api.device.runs.stream', $run), [
            'kind' => 'assistant_text_delta',
            'content' => 'Hel',
            'message' => 'Hel',
            'item_id' => 'item-abc',
        ])
        ->assertSuccessful();

    $event = ActionLog::query()->latest('id')->first();

    expect($event)->not->toBeNull()
        ->and($event?->action)->toBe('signals.stream.chunk')
        ->and($event?->metadata_json)->toMatchArray([
            'kind' => 'assistant_text_delta',
            'content' => 'Hel',
            'message' => 'Hel',
            'item_id' => 'item-abc',
            'is_error' => false,
        ]);
});
