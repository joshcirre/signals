<?php

use App\Models\ActionLog;
use App\Models\Proposal;
use App\Models\ReviewAnalysisRun;
use App\Models\User;

test('rejecting a proposal stores the rejection and writes an audit log', function (): void {
    $admin = User::factory()->create();
    $run = ReviewAnalysisRun::factory()->create([
        'user_id' => $admin->id,
    ]);
    $proposal = Proposal::factory()->create([
        'review_analysis_run_id' => $run->id,
        'status' => 'pending',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.proposals.reject', $proposal))
        ->assertRedirect();

    $proposal->refresh();

    expect($proposal->status)->toBe('rejected')
        ->and($proposal->approved_by)->toBe($admin->id)
        ->and(ActionLog::query()->where('action', 'proposal.rejected')->exists())->toBeTrue();
});
