<?php

use App\Models\Product;
use App\Models\Proposal;
use App\Models\Review;
use App\Models\ReviewAnalysisRun;
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
