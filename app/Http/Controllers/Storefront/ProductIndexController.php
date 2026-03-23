<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Product;
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

        return Inertia::render('storefront/index', [
            'products' => $products,
        ]);
    }
}
