<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Proposal;
use Inertia\Inertia;
use Inertia\Response;

class ProductIndexController extends Controller
{
    public function index(): Response
    {
        $products = Product::query()
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->orderBy('name')
            ->get()
            ->map(fn (Product $product): array => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'category' => $product->category,
                'price_cents' => $product->price_cents,
                'hero_image_url' => $product->hero_image_url,
                'short_description' => $product->short_description,
                'fit_note' => $product->fit_note,
                'review_count' => $product->reviews_count,
                'average_rating' => round((float) ($product->reviews_avg_rating ?? 0), 1),
            ]);

        $liveWidgets = Proposal::query()
            ->where('type', 'storefront_widget')
            ->where('status', 'applied')
            ->latest('applied_at')
            ->get()
            ->map(fn (Proposal $proposal): array => [
                'id' => $proposal->id,
                'position' => $proposal->payload_json['position'] ?? 'below_products',
                'title' => $proposal->payload_json['title'] ?? '',
                'arrow_source' => $proposal->payload_json['arrow_source'] ?? [],
            ]);

        return Inertia::render('storefront/index', [
            'products' => $products,
            'liveWidgets' => $liveWidgets,
        ]);
    }
}
