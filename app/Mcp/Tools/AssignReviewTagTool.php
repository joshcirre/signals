<?php

namespace App\Mcp\Tools;

use App\Models\Review;
use App\Models\ReviewTag;
use App\Models\ReviewTagAssignment;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Assign a normalized hidden review tag to one or more reviews.')]
class AssignReviewTagTool extends Tool
{
    public function handle(Request $request): Response
    {
        $reviewIds = collect($request->get('review_ids', []))
            ->filter(fn (mixed $reviewId): bool => is_numeric($reviewId))
            ->map(fn (mixed $reviewId): int => (int) $reviewId)
            ->values();

        $tag = is_numeric($request->get('review_tag_id'))
            ? ReviewTag::query()->findOrFail((int) $request->get('review_tag_id'))
            : ReviewTag::query()->firstOrCreate(
                ['normalized_name' => $request->string('normalized_name')->toString()],
                [
                    'name' => $request->string('normalized_name')->toString(),
                    'visibility' => 'internal',
                ],
            );

        foreach ($reviewIds as $reviewId) {
            Review::query()->findOrFail($reviewId);

            ReviewTagAssignment::query()->updateOrCreate(
                [
                    'review_id' => $reviewId,
                    'review_tag_id' => $tag->id,
                ],
                [
                    'confidence' => (float) ($request->get('confidence') ?? 0.800),
                    'assigned_by' => $request->string('assigned_by')->toString() ?: 'agent',
                ],
            );
        }

        return Response::json([
            'review_tag_id' => $tag->id,
            'assigned_review_ids' => $reviewIds->all(),
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'review_ids' => $schema->array()->items($schema->integer())->required(),
            'review_tag_id' => $schema->integer(),
            'normalized_name' => $schema->string(),
            'confidence' => $schema->number(),
            'assigned_by' => $schema->string()->enum(['agent', 'human']),
        ];
    }
}
