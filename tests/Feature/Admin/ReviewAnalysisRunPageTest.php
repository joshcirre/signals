<?php

use App\Models\ActionLog;
use App\Models\ReviewAnalysisRun;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('queueing a review analysis run redirects to the dedicated chat page', function (): void {
    $admin = User::factory()->create();

    $response = $this->actingAs($admin)
        ->post(route('admin.review-runs.store'));

    $run = ReviewAnalysisRun::query()
        ->where('user_id', $admin->id)
        ->latest()
        ->firstOrFail();

    $response->assertRedirect(route('admin.review-runs.show', $run));
});

test('admin can open their review analysis run chat page', function (): void {
    $admin = User::factory()->create();
    $run = ReviewAnalysisRun::factory()->create([
        'user_id' => $admin->id,
        'status' => 'running',
    ]);

    ActionLog::factory()->create([
        'review_analysis_run_id' => $run->id,
        'actor_type' => 'agent',
        'action' => 'codex.message',
        'metadata_json' => [
            'kind' => 'assistant_text',
            'content' => 'Checking the latest apparel review patterns now.',
            'item_id' => 'assistant-message-1',
        ],
    ]);

    $this->actingAs($admin)
        ->get(route('admin.review-runs.show', $run))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('admin/review-runs/show')
            ->where('run.id', $run->id)
            ->where('run.status', 'running')
            ->where('run.prompt', $run->prompt)
            ->has('run.events', 1)
            ->where('run.events.0.kind', 'assistant_text')
            ->where('run.events.0.content', 'Checking the latest apparel review patterns now.'));
});

test('admin cannot open another users review analysis run chat page', function (): void {
    $admin = User::factory()->create();
    $run = ReviewAnalysisRun::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.review-runs.show', $run))
        ->assertNotFound();
});
