<?php

use App\Events\SignalsHelperHeartbeatUpdated;
use App\Models\Product;
use App\Models\Proposal;
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
        ->toContain('find-storefront-page-override-proposal-tool')
        ->toContain('create-storefront-widget-proposal-tool')
        ->toContain('search-reviews-tool');
});

test('signals mcp server exposes the storefront override runtime resource and page override lookup tool results', function (): void {
    Event::fake([SignalsHelperHeartbeatUpdated::class]);

    $plainTextToken = 'signals-mcp-secret';
    $admin = User::factory()->create();
    $product = Product::factory()->create();

    SignalsDevice::factory()->create([
        'user_id' => $admin->id,
        'token_hash' => Hash::make($plainTextToken),
    ]);

    $proposal = Proposal::factory()->create([
        'type' => 'storefront_page_override',
        'target_type' => 'product',
        'target_id' => $product->id,
        'payload_json' => [
            'surface' => 'product_show',
            'title' => 'Premium Hoodie override',
            'arrow_source' => [
                'main.ts' => 'export default html`<section>Override</section>`;',
            ],
        ],
    ]);

    $resourcesResponse = $this->withHeaders([
        'Authorization' => 'Bearer '.$plainTextToken,
        'Accept' => 'application/json',
    ])->postJson(route('signals.mcp'), [
        'jsonrpc' => '2.0',
        'id' => 'resources-list-1',
        'method' => 'resources/list',
        'params' => [],
    ]);

    $resourcesResponse->assertOk();

    expect(collect($resourcesResponse->json('result.resources'))->pluck('uri'))
        ->toContain('signals://storefront-page-override-runtime');

    $runtimeResponse = $this->withHeaders([
        'Authorization' => 'Bearer '.$plainTextToken,
        'Accept' => 'application/json',
    ])->postJson(route('signals.mcp'), [
        'jsonrpc' => '2.0',
        'id' => 'resources-read-1',
        'method' => 'resources/read',
        'params' => [
            'uri' => 'signals://storefront-page-override-runtime',
        ],
    ]);

    $runtimeResponse->assertOk();

    $runtimeText = $runtimeResponse->json('result.contents.0.text');

    expect($runtimeText)
        ->toContain('./signals.ts')
        ->toContain("import { product, reviews, formatPrice } from './signals.ts';");

    $toolCallResponse = $this->withHeaders([
        'Authorization' => 'Bearer '.$plainTextToken,
        'Accept' => 'application/json',
    ])->postJson(route('signals.mcp'), [
        'jsonrpc' => '2.0',
        'id' => 'tool-call-1',
        'method' => 'tools/call',
        'params' => [
            'name' => 'find-storefront-page-override-proposal-tool',
            'arguments' => [
                'product_id' => $product->id,
                'surface' => 'product_show',
            ],
        ],
    ]);

    $toolCallResponse->assertOk();

    $toolPayload = json_decode($toolCallResponse->json('result.content.0.text'), true, flags: JSON_THROW_ON_ERROR);

    expect($toolPayload['proposals'][0]['id'] ?? null)->toBe($proposal->id)
        ->and($toolPayload['proposals'][0]['surface'] ?? null)->toBe('product_show');
});
