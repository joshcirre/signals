<?php

namespace App\Mcp\Tools;

use App\Models\Product;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Get one product with detailed storefront and review context.')]
class GetProductTool extends Tool
{
    public function handle(Request $request): Response
    {
        $product = is_numeric($request->get('product_id'))
            ? Product::query()->with(['reviewClusters'])->findOrFail((int) $request->get('product_id'))
            : Product::query()->with(['reviewClusters'])->where('slug', $request->string('product_slug')->toString())->firstOrFail();

        $product->loadCount('reviews');
        $product->loadAvg('reviews', 'rating');

        return Response::json([
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'category' => $product->category,
                'price_cents' => $product->price_cents,
                'short_description' => $product->short_description,
                'description' => $product->description,
                'fit_note' => $product->fit_note,
                'faq_items' => $product->faq_items ?? [],
                'review_count' => $product->reviews_count,
                'average_rating' => round((float) ($product->reviews_avg_rating ?? 0), 1),
                'clusters' => $product->reviewClusters->map(fn ($cluster) => [
                    'id' => $cluster->id,
                    'title' => $cluster->title,
                    'summary' => $cluster->summary,
                    'severity' => $cluster->severity,
                    'review_count' => $cluster->review_count,
                ])->values(),
            ],
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'product_id' => $schema->integer(),
            'product_slug' => $schema->string(),
        ];
    }
}
