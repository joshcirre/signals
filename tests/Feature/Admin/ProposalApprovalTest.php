<?php

use App\Models\Product;
use App\Models\Proposal;
use App\Models\ReviewAnalysisRun;
use App\Models\User;

test('approving a product copy proposal updates the storefront record', function () {
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
