<?php

use App\Models\Product;
use App\Models\Review;
use App\Models\ReviewTag;
use App\Models\ReviewTagAssignment;
use App\Models\SignalsDevice;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can search review intelligence by hidden tags and product data', function (): void {
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

test('new admin sees helper onboarding until a device checks in', function (): void {
    $admin = User::factory()->create();

    $this->actingAs($admin)
        ->get('/admin/signals')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('admin/signals')
            ->where('helper.latest_device_seen_at', null));

    SignalsDevice::factory()->create([
        'user_id' => $admin->id,
        'last_seen_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get('/admin/signals')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('admin/signals')
            ->where('helper.latest_device_seen_at', fn (?string $value): bool => $value !== null));
});

test('dashboard highlights local helper setup for a new admin', function (): void {
    $admin = User::factory()->create();

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('admin/dashboard')
            ->where('onboarding.needs_helper_setup', true));
});
