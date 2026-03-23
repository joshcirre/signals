<?php

namespace App\Mcp\Tools;

use App\Models\Proposal;
use App\Models\Review;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Create an approved-later draft response proposal for a low-rating review.')]
class CreateReviewResponseProposalTool extends Tool
{
    public function handle(Request $request): Response
    {
        $review = Review::query()->findOrFail((int) $request->get('review_id'));

        $proposal = Proposal::query()->create([
            'review_analysis_run_id' => is_numeric($request->get('review_analysis_run_id'))
                ? (int) $request->get('review_analysis_run_id')
                : null,
            'type' => 'review_response',
            'status' => 'pending',
            'target_type' => 'review',
            'target_id' => $review->id,
            'payload_json' => [
                'tone' => $request->string('tone')->toString() ?: 'empathetic',
                'response_draft' => $request->string('response_draft')->toString(),
            ],
            'rationale' => $request->string('rationale')->toString(),
            'confidence' => (float) ($request->get('confidence') ?? 0.750),
            'created_by' => 'agent',
        ]);

        return Response::json([
            'proposal_id' => $proposal->id,
            'status' => $proposal->status,
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'review_analysis_run_id' => $schema->integer(),
            'review_id' => $schema->integer()->required(),
            'response_draft' => $schema->string()->required(),
            'rationale' => $schema->string()->required(),
            'tone' => $schema->string(),
            'confidence' => $schema->number(),
        ];
    }
}
