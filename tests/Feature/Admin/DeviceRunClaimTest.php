<?php

use App\Models\ReviewAnalysisRun;
use App\Models\SignalsDevice;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('device token may claim a queued review analysis run', function () {
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
        ->assertJsonPath('run.id', $run->id);

    expect($run->fresh()->status)->toBe('running')
        ->and($run->fresh()->review_ops_device_id)->toBe($device->id);
});
