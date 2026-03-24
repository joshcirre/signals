<?php

use App\Models\Product;
use App\Models\Review;
use App\Models\StorefrontPageOverride;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;

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
        'short_description' => 'A trim everyday layer with a premium brushed interior.',
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
        ->assertSee('A trim everyday layer with a premium brushed interior.')
        ->assertSee('Customers say this hoodie runs small')
        ->assertSee('Loved the fabric but had to size up.');
});

test('product page shows approved review responses but hides unapproved drafts', function (): void {
    $product = Product::factory()->create([
        'name' => 'Cloudweight Tee',
        'slug' => 'cloudweight-tee',
    ]);

    Review::factory()->create([
        'product_id' => $product->id,
        'author_name' => 'Casey',
        'body' => 'Shipping was slow and I had no updates.',
        'response_draft' => 'Thanks for flagging the shipping delay. We are sorry the delivery window missed expectations.',
        'response_draft_status' => 'approved',
        'response_draft_approved_at' => now(),
    ]);

    Review::factory()->create([
        'product_id' => $product->id,
        'author_name' => 'Parker',
        'body' => 'Wish delivery updates were more consistent.',
        'response_draft' => 'Pending draft that should stay internal.',
        'response_draft_status' => 'pending',
    ]);

    $this->get(route('products.show', $product))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('storefront/show')
            ->where('reviews', function (mixed $reviews): bool {
                $approvedResponses = Collection::make($reviews)
                    ->map(fn (array $review): mixed => Arr::get($review, 'approved_response'))
                    ->all();

                return in_array(
                    'Thanks for flagging the shipping delay. We are sorry the delivery window missed expectations.',
                    $approvedResponses,
                    true,
                ) && in_array(null, $approvedResponses, true);
            }))
        ->assertSee('Thanks for flagging the shipping delay')
        ->assertDontSee('Pending draft that should stay internal.');
});

test('product page includes an applied page override when one exists', function (): void {
    $product = Product::factory()->create([
        'name' => 'Premium Hoodie',
        'slug' => 'premium-hoodie',
    ]);

    StorefrontPageOverride::factory()->create([
        'product_id' => $product->id,
        'surface' => 'product_show',
        'title' => 'Premium Hoodie live page',
        'arrow_source_json' => [
            'main.ts' => 'import { html } from "@arrow-js/core"; import { product } from "./signals.ts"; export default html`<section>${product.name}</section>`;',
        ],
    ]);

    $this->get(route('products.show', $product))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('storefront/show')
            ->where('pageOverride.title', 'Premium Hoodie live page')
            ->where('pageOverride.surface', 'product_show')
            ->where('pageOverride.arrow_source', [
                'main.ts' => 'import { html } from "@arrow-js/core"; import { product } from "./signals.ts"; export default html`<section>${product.name}</section>`;',
            ]));
});

test('product page ignores an invalid applied page override', function (): void {
    $product = Product::factory()->create([
        'name' => 'Premium Hoodie',
        'slug' => 'premium-hoodie',
    ]);

    StorefrontPageOverride::factory()->create([
        'product_id' => $product->id,
        'surface' => 'product_show',
        'title' => 'Broken live page',
        'arrow_source_json' => [
            'main.ts' => 'export default html`<section>Broken</section>`',
        ],
    ]);

    $this->get(route('products.show', $product))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('storefront/show')
            ->where('pageOverride', null));
});

test('welcome page is not exposed publicly', function (): void {
    $this->get('/welcome')->assertNotFound();
});
