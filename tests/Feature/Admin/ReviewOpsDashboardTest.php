<?php

use App\Models\Product;
use App\Models\Review;
use App\Models\ReviewTag;
use App\Models\ReviewTagAssignment;
use App\Models\User;

test('admin can search review intelligence by hidden tags and product data', function () {
    $admin = User::factory()->create();
    $product = Product::factory()->create([
        'name' => 'Premium Hoodie',
        'slug' => 'premium-hoodie',
    ]);
    $review = Review::factory()->create([
        'product_id' => $product->id,
        'title' => 'Runs tiny',
        'body' => 'Too tight through the shoulders.',
    ]);
    $tag = ReviewTag::factory()->create([
        'name' => 'Sizing Issue',
        'normalized_name' => 'Sizing Issue',
    ]);

    ReviewTagAssignment::factory()->create([
        'review_id' => $review->id,
        'review_tag_id' => $tag->id,
    ]);

    $this->actingAs($admin)
        ->get('/admin/signals?q=Sizing')
        ->assertSuccessful()
        ->assertSee('Premium Hoodie')
        ->assertSee('Sizing Issue')
        ->assertSee('Too tight through the shoulders.');
});
