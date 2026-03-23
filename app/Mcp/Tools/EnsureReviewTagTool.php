<?php

namespace App\Mcp\Tools;

use App\Models\ReviewTag;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Ensure a normalized hidden review tag exists and return its identifier.')]
class EnsureReviewTagTool extends Tool
{
    public function handle(Request $request): Response
    {
        $normalizedName = $request->string('normalized_name')->toString();

        $tag = ReviewTag::query()->firstOrCreate(
            ['normalized_name' => $normalizedName],
            [
                'name' => $request->string('name')->toString() ?: $normalizedName,
                'visibility' => $request->string('visibility')->toString() ?: 'internal',
            ],
        );

        return Response::json([
            'review_tag_id' => $tag->id,
            'normalized_name' => $tag->normalized_name,
            'visibility' => $tag->visibility,
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'normalized_name' => $schema->string()->required(),
            'name' => $schema->string(),
            'visibility' => $schema->string()->enum(['internal', 'public']),
        ];
    }
}
