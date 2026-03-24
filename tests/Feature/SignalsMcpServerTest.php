<?php

use App\Events\SignalsHelperHeartbeatUpdated;
use App\Models\SignalsDevice;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;

test('signals mcp server lists tools for an authenticated helper session', function (): void {
    Event::fake([SignalsHelperHeartbeatUpdated::class]);

    $plainTextToken = 'signals-mcp-secret';
    $admin = User::factory()->create();

    SignalsDevice::factory()->create([
        'user_id' => $admin->id,
        'token_hash' => Hash::make($plainTextToken),
    ]);

    $toolsResponse = $this->withHeaders([
        'Authorization' => 'Bearer '.$plainTextToken,
        'Accept' => 'application/json',
    ])->postJson(route('signals.mcp'), [
        'jsonrpc' => '2.0',
        'id' => 'tools-list-1',
        'method' => 'tools/list',
        'params' => [],
    ]);

    $toolsResponse->assertOk();

    $toolNames = collect($toolsResponse->json('result.tools'))->pluck('name');

    expect($toolNames)
        ->toContain('create-storefront-page-override-proposal-tool')
        ->toContain('create-storefront-widget-proposal-tool')
        ->toContain('search-reviews-tool');
});
