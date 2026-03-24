<?php

use App\Models\Product;
use App\Models\Proposal;
use App\Models\Review;
use App\Models\ReviewAnalysisRun;
use App\Models\StorefrontPageOverride;
use App\Models\User;

test('approving a product copy proposal updates the storefront record', function (): void {
    $admin = User::factory()->create();
    $product = Product::factory()->create([
        'fit_note' => null,
    ]);
    $run = ReviewAnalysisRun::factory()->create([
        'user_id' => $admin->id,
    ]);
    $proposal = Proposal::factory()->create([
        'review_analysis_run_id' => $run->id,
        'target_id' => $product->id,
        'payload_json' => [
            'field' => 'fit_note',
            'before' => null,
            'after' => 'Customers say this hoodie runs small. Consider sizing up for a roomier fit.',
            'supporting_review_ids' => [],
        ],
    ]);

    $this->actingAs($admin)
        ->post(route('admin.proposals.approve', $proposal))
        ->assertRedirect();

    expect($proposal->fresh()->status)->toBe('applied')
        ->and($product->fresh()->fit_note)->toContain('runs small');
});

test('approving a review response proposal saves the approved draft on the review', function (): void {
    $admin = User::factory()->create();
    $review = Review::factory()->create();
    $run = ReviewAnalysisRun::factory()->create([
        'user_id' => $admin->id,
    ]);
    $proposal = Proposal::factory()->create([
        'review_analysis_run_id' => $run->id,
        'type' => 'review_response',
        'target_type' => 'review',
        'target_id' => $review->id,
        'payload_json' => [
            'response_draft' => 'Thanks for the feedback. We are sorry the fit missed the mark and would be happy to help with an exchange.',
            'tone' => 'empathetic',
        ],
    ]);

    $this->actingAs($admin)
        ->post(route('admin.proposals.approve', $proposal))
        ->assertRedirect();

    expect($proposal->fresh()->status)->toBe('applied')
        ->and($review->fresh()->response_draft)->toContain('sorry the fit missed the mark')
        ->and($review->fresh()->response_draft_status)->toBe('approved');
});

test('approving a product description proposal updates the storefront description fields', function (): void {
    $admin = User::factory()->create();
    $product = Product::factory()->create([
        'short_description' => 'Original lead copy.',
        'description' => 'Original long description.',
    ]);
    $run = ReviewAnalysisRun::factory()->create([
        'user_id' => $admin->id,
    ]);
    $proposal = Proposal::factory()->create([
        'review_analysis_run_id' => $run->id,
        'target_id' => $product->id,
        'payload_json' => [
            'field' => 'short_description',
            'before' => 'Original lead copy.',
            'after' => 'Updated lead copy shaped by the latest fit feedback.',
            'supporting_review_ids' => [],
        ],
    ]);

    $this->actingAs($admin)
        ->post(route('admin.proposals.approve', $proposal))
        ->assertRedirect();

    expect($proposal->fresh()->status)->toBe('applied')
        ->and($product->fresh()->short_description)->toBe('Updated lead copy shaped by the latest fit feedback.');
});

test('approving a storefront page override proposal creates a live page override record', function (): void {
    $admin = User::factory()->create();
    $product = Product::factory()->create();
    $run = ReviewAnalysisRun::factory()->create([
        'user_id' => $admin->id,
    ]);
    $proposal = Proposal::factory()->create([
        'review_analysis_run_id' => $run->id,
        'type' => 'storefront_page_override',
        'target_type' => 'product',
        'target_id' => $product->id,
        'payload_json' => [
            'surface' => 'product_show',
            'title' => 'Premium Hoodie live page',
            'arrow_source' => [
                'main.ts' => 'import { html } from "@arrow-js/core"; import { product } from "./signals.ts"; export default html`<section>${product.name}</section>`;',
            ],
        ],
    ]);

    $this->actingAs($admin)
        ->post(route('admin.proposals.approve', $proposal))
        ->assertRedirect();

    $override = StorefrontPageOverride::query()
        ->where('product_id', $product->id)
        ->where('surface', 'product_show')
        ->firstOrFail();

    expect($proposal->fresh()->status)->toBe('applied')
        ->and($override->title)->toBe('Premium Hoodie live page')
        ->and($override->arrow_source_json['main.ts'])->toContain('@arrow-js/core')
        ->and($override->created_from_proposal_id)->toBe($proposal->id);
});

test('approving an invalid storefront page override proposal leaves it pending', function (): void {
    $admin = User::factory()->create();
    $product = Product::factory()->create();
    $run = ReviewAnalysisRun::factory()->create([
        'user_id' => $admin->id,
    ]);
    $proposal = Proposal::factory()->create([
        'review_analysis_run_id' => $run->id,
        'type' => 'storefront_page_override',
        'target_type' => 'product',
        'target_id' => $product->id,
        'payload_json' => [
            'surface' => 'product_show',
            'title' => 'Broken live page',
            'arrow_source' => [
                'main.ts' => 'export default html`<section>Broken</section>`',
            ],
        ],
    ]);

    $this->actingAs($admin)
        ->post(route('admin.proposals.approve', $proposal))
        ->assertRedirect()
        ->assertSessionHasErrors('proposal');

    expect($proposal->fresh()->status)->toBe('pending')
        ->and(StorefrontPageOverride::query()->where('created_from_proposal_id', $proposal->id)->exists())->toBeFalse();
});
