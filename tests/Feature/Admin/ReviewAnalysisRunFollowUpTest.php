<?php

use App\Models\ActionLog;
use App\Models\ReviewAnalysisRun;
use App\Models\ReviewAnalysisRunFollowUp;
use App\Models\SignalsDevice;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('admin can queue a follow-up on an active codex run session', function (): void {
    $admin = User::factory()->create();
    $run = ReviewAnalysisRun::factory()->create([
        'user_id' => $admin->id,
        'status' => 'completed',
        'codex_thread_id' => 'thread_live_123',
        'codex_session_status' => 'active',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.review-runs.follow-ups.store', $run), [
            'content' => 'Make the fit callout more red.',
        ])
        ->assertRedirect();

    $followUp = ReviewAnalysisRunFollowUp::query()->first();
    $event = ActionLog::query()->latest('id')->first();

    expect($followUp)->not->toBeNull()
        ->and($followUp?->review_analysis_run_id)->toBe($run->id)
        ->and($followUp?->status)->toBe('queued')
        ->and($followUp?->content)->toBe('Make the fit callout more red.')
        ->and($event?->action)->toBe('codex.follow-up.queued')
        ->and($event?->metadata_json)->toMatchArray([
            'kind' => 'user_text',
            'content' => 'Make the fit callout more red.',
        ]);
});

test('admin cannot queue a follow-up when no codex thread is attached', function (): void {
    $admin = User::factory()->create();
    $run = ReviewAnalysisRun::factory()->create([
        'user_id' => $admin->id,
        'codex_thread_id' => null,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.review-runs.follow-ups.store', $run), [
            'content' => 'Make it warmer.',
        ])
        ->assertStatus(422);

    expect(ReviewAnalysisRunFollowUp::query()->count())->toBe(0);
});

test('device can claim and complete a queued follow-up for an active run session', function (): void {
    $admin = User::factory()->create();
    $plainTextToken = 'signals-secret-token';
    $device = SignalsDevice::factory()->create([
        'user_id' => $admin->id,
        'token_hash' => Hash::make($plainTextToken),
    ]);
    $run = ReviewAnalysisRun::factory()->create([
        'user_id' => $admin->id,
        'review_ops_device_id' => $device->id,
        'status' => 'completed',
        'codex_thread_id' => 'thread_live_123',
        'codex_session_status' => 'active',
    ]);
    $followUp = ReviewAnalysisRunFollowUp::factory()->create([
        'review_analysis_run_id' => $run->id,
        'requested_by' => $admin->id,
        'content' => 'Make the fit note redder.',
        'status' => 'queued',
    ]);

    $this->withHeader('Authorization', 'Bearer '.$plainTextToken)
        ->postJson(route('api.device.follow-ups.claim'), [
            'active_run_ids' => [$run->id],
        ])
        ->assertSuccessful()
        ->assertJsonPath('follow_up.id', $followUp->id)
        ->assertJsonPath('follow_up.review_analysis_run_id', $run->id)
        ->assertJsonPath('follow_up.content', 'Make the fit note redder.');

    expect($followUp->fresh()->status)->toBe('running')
        ->and($followUp->fresh()->started_at)->not->toBeNull()
        ->and($run->fresh()->status)->toBe('running');

    $this->withHeader('Authorization', 'Bearer '.$plainTextToken)
        ->postJson(route('api.device.follow-ups.complete', [$run, $followUp]), [
            'summary' => 'Updated the fit callout styling.',
        ])
        ->assertSuccessful();

    expect($followUp->fresh()->status)->toBe('completed')
        ->and($followUp->fresh()->summary)->toBe('Updated the fit callout styling.')
        ->and($run->fresh()->status)->toBe('completed')
        ->and($run->fresh()->summary)->toBe('Updated the fit callout styling.');
});
