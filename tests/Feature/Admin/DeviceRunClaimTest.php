<?php

use App\Events\SignalsHelperHeartbeatUpdated;
use App\Models\ReviewAnalysisRun;
use App\Models\SignalsDevice;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;

test('device token may claim a queued review analysis run', function (): void {
    $admin = User::factory()->create();
    $plainTextToken = 'signals-secret-token';
    $device = SignalsDevice::factory()->create([
        'user_id' => $admin->id,
        'name' => 'Signals Helper',
        'token_hash' => Hash::make($plainTextToken),
    ]);
    $run = ReviewAnalysisRun::factory()->create([
        'user_id' => $admin->id,
        'status' => 'queued',
    ]);

    $response = $this->withHeader('Authorization', 'Bearer '.$plainTextToken)
        ->postJson(route('api.device.runs.claim'));

    $response->assertSuccessful()
        ->assertJsonPath('run.id', $run->id)
        ->assertJsonPath('run.kind', 'review_analysis')
        ->assertJsonPath('run.context', null);

    expect($run->fresh()->status)->toBe('running')
        ->and($run->fresh()->review_ops_device_id)->toBe($device->id);
});

test('device claim response includes storefront adaptation context', function (): void {
    $admin = User::factory()->create();
    $plainTextToken = 'signals-secret-token';
    SignalsDevice::factory()->create([
        'user_id' => $admin->id,
        'name' => 'Signals Helper',
        'token_hash' => Hash::make($plainTextToken),
    ]);
    $run = ReviewAnalysisRun::factory()->create([
        'user_id' => $admin->id,
        'status' => 'queued',
        'kind' => 'storefront_adaptation',
        'context_json' => [
            'product_slug' => 'premium-hoodie',
            'proposal_field' => 'fit_note',
        ],
    ]);

    $this->withHeader('Authorization', 'Bearer '.$plainTextToken)
        ->postJson(route('api.device.runs.claim'))
        ->assertSuccessful()
        ->assertJsonPath('run.id', $run->id)
        ->assertJsonPath('run.kind', 'storefront_adaptation')
        ->assertJsonPath('run.context.product_slug', 'premium-hoodie')
        ->assertJsonPath('run.context.proposal_field', 'fit_note');
});

test('device authentication broadcasts helper heartbeat updates', function (): void {
    Event::fake([SignalsHelperHeartbeatUpdated::class]);

    $admin = User::factory()->create();
    $plainTextToken = 'signals-secret-token';
    $device = SignalsDevice::factory()->create([
        'user_id' => $admin->id,
        'name' => 'Signals Helper',
        'token_hash' => Hash::make($plainTextToken),
        'last_seen_at' => null,
    ]);

    $response = $this->withHeader('Authorization', 'Bearer '.$plainTextToken)
        ->postJson(route('api.device.runs.claim'));

    $response->assertSuccessful()
        ->assertJsonPath('run', null);

    expect($device->fresh()->last_seen_at)->not->toBeNull();

    Event::assertDispatched(SignalsHelperHeartbeatUpdated::class, function (SignalsHelperHeartbeatUpdated $event) use ($device): bool {
        return $event->device->is($device)
            && $event->device->last_seen_at !== null;
    });
});
