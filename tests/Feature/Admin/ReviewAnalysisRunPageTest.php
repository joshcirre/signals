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
        ->and($run->prompt)->toContain('Use create_storefront_page_override_proposal_tool to create the live storefront change.')
        ->and($run->prompt)->toContain('Do not edit shared Laravel or React storefront files.')
        ->and($run->prompt)->toContain('surface="product_show"')
        ->and($run->context_json)->toMatchArray([
            'product_slug' => 'premium-hoodie',
            'proposal_id' => $proposal->id,
            'proposal_field' => 'short_description',
            'proposal_after' => 'A softer, slimmer hoodie with a fit note right where shoppers need it.',
            'supporting_review_ids' => [101, 202],
            'preferred_override_surface' => 'product_show',
        ]);
});

test('admin can queue a storefront adaptation run from another users pending proposal', function (): void {
    $admin = User::factory()->create();
    $proposalOwner = User::factory()->create();
    $product = Product::factory()->create([
        'name' => 'Premium Hoodie',
        'slug' => 'premium-hoodie',
    ]);
    $proposalRun = ReviewAnalysisRun::factory()->create([
        'user_id' => $proposalOwner->id,
    ]);
    $proposal = Proposal::factory()->create([
        'review_analysis_run_id' => $proposalRun->id,
        'target_id' => $product->id,
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

    expect($run->context_json)->toMatchArray([
        'product_slug' => 'premium-hoodie',
        'proposal_id' => $proposal->id,
    ]);
});

test('admin can queue a ui refinement run for a storefront page override proposal', function (): void {
    $admin = User::factory()->create();
    $product = Product::factory()->create([
        'name' => 'Premium Hoodie',
        'slug' => 'premium-hoodie',
    ]);
    $proposal = Proposal::factory()->create([
        'review_analysis_run_id' => ReviewAnalysisRun::factory()->create([
            'user_id' => $admin->id,
        ])->id,
        'type' => 'storefront_page_override',
        'target_type' => 'product',
        'target_id' => $product->id,
        'payload_json' => [
            'surface' => 'product_show',
            'title' => 'Premium Hoodie live page',
            'arrow_source' => [
                'main.ts' => 'export default html`<section>Override</section>`',
            ],
        ],
    ]);

    $response = $this->actingAs($admin)
        ->post(route('admin.review-runs.store'), [
            'kind' => 'ui_refinement',
            'proposal_id' => $proposal->id,
            'focus' => 'Move the fit guidance above the price',
            'redirect_to' => 'proposals',
        ]);

    $run = ReviewAnalysisRun::query()
        ->where('user_id', $admin->id)
        ->where('kind', 'ui_refinement')
        ->latest('id')
        ->firstOrFail();

    $response->assertRedirect(route('admin.proposals.index'));

    expect($run->prompt)->toContain('create_storefront_page_override_proposal_tool')
        ->and($run->context_json)->toMatchArray([
            'arrow_proposal_id' => $proposal->id,
            'surface' => 'product_show',
            'title' => 'Premium Hoodie live page',
            'focus' => 'Move the fit guidance above the price',
        ]);
});

test('signals workspace can queue a focused run and stay on the signals page', function (): void {
    $admin = User::factory()->create();

    $response = $this->actingAs($admin)
        ->post(route('admin.review-runs.store'), [
            'kind' => 'review_analysis',
            'focus' => 'Premium hoodie sizing complaints',
            'redirect_to' => 'signals',
        ]);

    $run = ReviewAnalysisRun::query()
        ->where('user_id', $admin->id)
        ->latest('id')
        ->firstOrFail();

    $response->assertRedirect(route('admin.signals', [
        'q' => 'Premium hoodie sizing complaints',
    ]));

    expect($run->prompt)->toContain('Focus area: Premium hoodie sizing complaints')
        ->and($run->context_json)->toMatchArray([
            'focus' => 'Premium hoodie sizing complaints',
        ]);
});

test('admin cannot open another users review analysis run chat page', function (): void {
    $admin = User::factory()->create();
    $run = ReviewAnalysisRun::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.review-runs.show', $run))
        ->assertNotFound();
});
