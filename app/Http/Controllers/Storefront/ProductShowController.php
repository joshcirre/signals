<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use Inertia\Inertia;
use Inertia\Response;

class ProductShowController extends Controller
{
    public function show(Product $product): Response
    {
        $product->load([
            'reviews' => fn ($query) => $query->latest('reviewed_at'),
        ]);

        return Inertia::render('storefront/show', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'category' => $product->category,
                'price_cents' => $product->price_cents,
                'hero_image_url' => $product->hero_image_url,
                'short_description' => $product->short_description,
                'description' => $product->description,
                'fit_note' => $product->fit_note,
                'faq_items' => $product->faq_items ?? [],
                'average_rating' => round((float) $product->reviews->avg('rating'), 1),
                'review_count' => $product->reviews->count(),
            ],
            'reviews' => $product->reviews->map(fn (Review $review): array => [
                'id' => $review->id,
                'author_name' => $review->author_name,
                'rating' => $review->rating,
                'title' => $review->title,
                'body' => $review->body,
                'reviewed_at' => $review->reviewed_at?->toDateString(),
            ]),
        ]);
    }
}
