<?php

use App\Models\ActionLog;
use App\Models\ReviewAnalysisRun;
use App\Models\ReviewOpsDevice;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('device event ingestion preserves structured metadata for streamed codex updates', function () {
    $admin = User::factory()->create();
    $plainTextToken = 'reviewops-secret-token';
    $device = ReviewOpsDevice::factory()->create([
        'user_id' => $admin->id,
        'token_hash' => Hash::make($plainTextToken),
    ]);
    $run = ReviewAnalysisRun::factory()->create([
        'user_id' => $admin->id,
        'review_ops_device_id' => $device->id,
        'status' => 'running',
    ]);

    $this->withHeader('Authorization', 'Bearer '.$plainTextToken)
        ->postJson(route('api.device.runs.events', $run), [
            'action' => 'mcp.server.ready',
            'message' => 'Codex discovered the ReviewOps MCP server.',
            'kind' => 'status',
            'tool_name' => 'mcp__reviewops__list_reviews',
            'metadata' => [
                'server_name' => 'reviewops',
                'resource_count' => 2,
                'tool_names' => [
                    'mcp__reviewops__list_products',
                    'mcp__reviewops__list_reviews',
                ],
            ],
        ])
        ->assertSuccessful();

    $event = ActionLog::query()->latest('id')->first();

    expect($event)->not->toBeNull()
        ->and($event?->action)->toBe('mcp.server.ready')
        ->and($event?->metadata_json)->toMatchArray([
            'message' => 'Codex discovered the ReviewOps MCP server.',
            'kind' => 'status',
            'tool_name' => 'mcp__reviewops__list_reviews',
            'server_name' => 'reviewops',
            'resource_count' => 2,
            'tool_names' => [
                'mcp__reviewops__list_products',
                'mcp__reviewops__list_reviews',
            ],
        ]);
});
