<?php

use App\Models\Product;
use App\Models\Review;

test('storefront homepage lists seeded products', function (): void {
    Product::factory()->create([
        'name' => 'Premium Hoodie',
        'slug' => 'premium-hoodie',
    ]);

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertSee('Premium Hoodie');
});

test('product page shows fit notes and reviews', function (): void {
    $product = Product::factory()->create([
        'name' => 'Premium Hoodie',
        'slug' => 'premium-hoodie',
        'fit_note' => 'Customers say this hoodie runs small. Consider sizing up for a roomier fit.',
    ]);

    Review::factory()->create([
        'product_id' => $product->id,
        'author_name' => 'Mia',
        'title' => 'Runs small',
        'body' => 'Loved the fabric but had to size up.',
    ]);

    $this->get(route('products.show', $product))
        ->assertSuccessful()
        ->assertSee('Customers say this hoodie runs small')
        ->assertSee('Loved the fabric but had to size up.');
});
