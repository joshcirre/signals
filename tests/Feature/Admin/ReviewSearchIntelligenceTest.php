<?php

use App\Models\Product;
use App\Models\Review;
use App\Models\ReviewCluster;
use App\Models\ReviewTag;
use App\Models\ReviewTagAssignment;
use App\Models\User;

test('natural language review search matches hidden tags and cluster context', function () {
    $admin = User::factory()->create();
    $product = Product::factory()->create([
        'name' => 'Premium Hoodie',
        'slug' => 'premium-hoodie',
        'short_description' => 'Heavyweight fleece hoodie for cooler nights.',
    ]);
    $review = Review::factory()->create([
        'product_id' => $product->id,
        'title' => 'Runs tiny',
        'body' => 'Comfortable fabric, but the fit was much tighter than expected.',
    ]);
    $tag = ReviewTag::factory()->create([
        'name' => 'Sizing Issue',
        'normalized_name' => 'Sizing Issue',
    ]);

    ReviewTagAssignment::factory()->create([
        'review_id' => $review->id,
        'review_tag_id' => $tag->id,
    ]);

    ReviewCluster::factory()->create([
        'product_id' => $product->id,
        'title' => 'Sizing complaints on hoodie',
        'summary' => 'Recent reviews mention the hoodie running small or tight through the shoulders.',
    ]);

    $this->actingAs($admin)
        ->get('/admin/signals?q=hoodie reviews about sizing')
        ->assertSuccessful()
        ->assertSee('Premium Hoodie')
        ->assertSee('Sizing Issue')
        ->assertSee('Sizing complaints on hoodie')
        ->assertSee('Hidden tag match: Sizing Issue');
});
