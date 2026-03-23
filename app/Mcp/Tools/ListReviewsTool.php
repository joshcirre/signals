<?php

namespace App\Mcp\Tools;

use App\Models\Review;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('List reviews with associated products and hidden normalized tags.')]
class ListReviewsTool extends Tool
{
    public function handle(Request $request): Response
    {
        $limit = min((int) ($request->get('limit') ?? 10), 25);
        $productSlug = $request->get('product_slug');
        $ratingMax = $request->get('rating_max');
        $unprocessedOnly = (bool) ($request->get('unprocessed_only') ?? false);

        $reviews = Review::query()
            ->with(['product', 'tagAssignments.reviewTag'])
            ->when(is_string($productSlug) && $productSlug !== '', fn ($query) => $query->whereHas('product', fn ($productQuery) => $productQuery->where('slug', $productSlug)))
            ->when(is_numeric($ratingMax), fn ($query) => $query->where('rating', '<=', (int) $ratingMax))
            ->when($unprocessedOnly, fn ($query) => $query->whereNull('processed_at'))
            ->latest('reviewed_at')
            ->limit($limit)
            ->get()
            ->map(fn (Review $review) => [
                'id' => $review->id,
                'product' => [
                    'id' => $review->product?->id,
                    'name' => $review->product?->name,
                    'slug' => $review->product?->slug,
                ],
                'author_name' => $review->author_name,
                'rating' => $review->rating,
                'title' => $review->title,
                'body' => $review->body,
                'reviewed_at' => $review->reviewed_at?->toIso8601String(),
                'processed_at' => $review->processed_at?->toIso8601String(),
                'tags' => $review->tagAssignments->map(fn ($assignment) => [
                    'name' => $assignment->reviewTag?->normalized_name,
                    'confidence' => (float) $assignment->confidence,
                ]),
            ]);

        return Response::json([
            'reviews' => $reviews,
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'limit' => $schema->integer()->min(1)->max(25),
            'product_slug' => $schema->string(),
            'rating_max' => $schema->integer()->min(1)->max(5),
            'unprocessed_only' => $schema->boolean(),
        ];
    }
}
