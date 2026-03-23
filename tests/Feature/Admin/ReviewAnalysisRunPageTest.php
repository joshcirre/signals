<?php

use App\Models\ActionLog;
use App\Models\Product;
use App\Models\Proposal;
use App\Models\ReviewAnalysisRun;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('queueing a review analysis run redirects to the dedicated chat page', function (): void {
    $admin = User::factory()->create();

    $response = $this->actingAs($admin)
        ->post(route('admin.review-runs.store'));

    $run = ReviewAnalysisRun::query()
        ->where('user_id', $admin->id)
        ->latest('id')
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
            ->where('run.kind', 'review_analysis')
            ->where('run.prompt', $run->prompt)
            ->has('run.events', 1)
            ->where('run.events.0.kind', 'assistant_text')
            ->where('run.events.0.content', 'Checking the latest apparel review patterns now.'));
});

test('queueing a storefront adaptation run stores the proposal context', function (): void {
    $admin = User::factory()->create();
    $product = Product::factory()->create([
        'name' => 'Premium Hoodie',
        'slug' => 'premium-hoodie',
    ]);
    $proposalRun = ReviewAnalysisRun::factory()->create([
        'user_id' => $admin->id,
    ]);
    $proposal = Proposal::factory()->create([
        'review_analysis_run_id' => $proposalRun->id,
        'target_id' => $product->id,
        'payload_json' => [
            'field' => 'short_description',
            'before' => $product->short_description,
            'after' => 'A softer, slimmer hoodie with a fit note right where shoppers need it.',
            'supporting_review_ids' => [101, 202],
        ],
    ]);

    $response = $this->actingAs($admin)
        ->post(route('admin.review-runs.store'), [
            'kind' => 'storefront_adaptation',
            'proposal_id' => $proposal->id,
        ]);

    $run = ReviewAnalysisRun::query()
        ->where('user_id', $admin->id)
        ->where('kind', 'storefront_adaptation')
        ->latest('id')
        ->firstOrFail();

    $response->assertRedirect(route('admin.review-runs.show', $run));

    expect($run->kind)->toBe('storefront_adaptation')
        ->and($run->context_json)->toMatchArray([
            'product_slug' => 'premium-hoodie',
            'proposal_id' => $proposal->id,
            'proposal_field' => 'short_description',
            'proposal_after' => 'A softer, slimmer hoodie with a fit note right where shoppers need it.',
            'supporting_review_ids' => [101, 202],
        ]);
});

test('admin cannot open another users review analysis run chat page', function (): void {
    $admin = User::factory()->create();
    $run = ReviewAnalysisRun::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.review-runs.show', $run))
        ->assertNotFound();
});
