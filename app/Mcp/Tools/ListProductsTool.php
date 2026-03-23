<?php

namespace App\Mcp\Tools;

use App\Models\Product;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('List products available in the storefront with key metadata needed for review analysis.')]
class ListProductsTool extends Tool
{
    public function handle(Request $request): Response
    {
        $limit = min((int) ($request->get('limit') ?? 10), 25);
        $status = $request->get('status');

        $products = Product::query()
            ->when(is_string($status) && $status !== '', fn ($query) => $query->where('status', $status))
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'category' => $product->category,
                'price_cents' => $product->price_cents,
                'fit_note' => $product->fit_note,
                'review_count' => $product->reviews_count,
                'average_rating' => round((float) ($product->reviews_avg_rating ?? 0), 1),
            ]);

        return Response::json([
            'products' => $products,
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'limit' => $schema->integer()->min(1)->max(25),
            'status' => $schema->string()->enum(['active', 'archived']),
        ];
    }
}
