<?php

namespace App\Mcp\Tools;

use App\Models\Product;
use App\Models\ReviewCluster;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Create or update a hidden complaint cluster for a product.')]
class UpsertReviewClusterTool extends Tool
{
    public function handle(Request $request): Response
    {
        $product = is_numeric($request->get('product_id'))
            ? Product::query()->findOrFail((int) $request->get('product_id'))
            : Product::query()->where('slug', $request->string('product_slug')->toString())->firstOrFail();

        $cluster = ReviewCluster::query()->updateOrCreate(
            [
                'product_id' => $product->id,
                'title' => $request->string('title')->toString(),
            ],
            [
                'summary' => $request->string('summary')->toString(),
                'severity' => $request->string('severity')->toString() ?: 'medium',
                'review_count' => (int) ($request->get('review_count') ?? 1),
            ],
        );

        return Response::json([
            'review_cluster_id' => $cluster->id,
            'product_id' => $product->id,
            'title' => $cluster->title,
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'product_id' => $schema->integer(),
            'product_slug' => $schema->string(),
            'title' => $schema->string()->required(),
            'summary' => $schema->string()->required(),
            'severity' => $schema->string()->enum(['low', 'medium', 'high']),
            'review_count' => $schema->integer(),
        ];
    }
}
