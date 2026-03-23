<?php

namespace App\Mcp\Tools;

use App\Models\Review;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Mark one or more reviews as processed after Codex finishes analysis.')]
class MarkReviewsProcessedTool extends Tool
{
    public function handle(Request $request): Response
    {
        $reviewIds = collect($request->get('review_ids', []))
            ->filter(fn (mixed $reviewId): bool => is_numeric($reviewId))
            ->map(fn (mixed $reviewId): int => (int) $reviewId)
            ->values();

        Review::query()
            ->whereIn('id', $reviewIds)
            ->update([
                'processed_at' => now(),
            ]);

        return Response::json([
            'processed_review_ids' => $reviewIds->all(),
            'processed_at' => now()->toIso8601String(),
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'review_ids' => $schema->array()->items($schema->integer())->required(),
        ];
    }
}
