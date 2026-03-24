<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Proposal;
use App\Models\Review;
use App\Models\StorefrontPageOverride;
use Inertia\Inertia;
use Inertia\Response;

class ProductShowController extends Controller
{
    public function show(Product $product): Response
    {
        $product->load([
            'reviews' => fn ($query) => $query->latest('reviewed_at'),
        ]);
        $pageOverride = StorefrontPageOverride::query()
            ->where('product_id', $product->id)
            ->where('surface', 'product_show')
            ->first();

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
            'pageOverride' => $pageOverride ? [
                'id' => $pageOverride->id,
                'title' => $pageOverride->title,
                'surface' => $pageOverride->surface,
                'arrow_source' => $pageOverride->arrow_source_json,
            ] : null,
            'liveWidgets' => Proposal::query()
                ->where('type', 'storefront_widget')
                ->where('status', 'applied')
                ->latest('applied_at')
                ->get()
                ->map(fn (Proposal $proposal): array => [
                    'id' => $proposal->id,
                    'position' => $proposal->payload_json['position'] ?? 'below_products',
                    'title' => $proposal->payload_json['title'] ?? '',
                    'arrow_source' => $proposal->payload_json['arrow_source'] ?? [],
                ]),
            'reviews' => $product->reviews->map(fn (Review $review): array => [
                'id' => $review->id,
                'author_name' => $review->author_name,
                'rating' => $review->rating,
                'title' => $review->title,
                'body' => $review->body,
                'reviewed_at' => $review->reviewed_at?->toDateString(),
                'approved_response' => $review->response_draft_status === 'approved'
                    ? $review->response_draft
                    : null,
                'response_approved_at' => $review->response_draft_status === 'approved'
                    ? $review->response_draft_approved_at?->toDateString()
                    : null,
            ]),
        ]);
    }
}
