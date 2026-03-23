<?php

namespace App\Mcp\Tools;

use App\Models\Product;
use App\Models\Proposal;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Create a merchant-facing product copy proposal, such as a fit note update, for later approval in Signals.')]
class CreateProductCopyChangeProposalTool extends Tool
{
    public function handle(Request $request): Response
    {
        $product = Product::query()->where('slug', $request->string('product_slug')->toString())->firstOrFail();
        $field = $request->string('field')->toString();
        $before = match ($field) {
            'short_description' => $product->short_description,
            'description' => $product->description,
            default => $product->fit_note,
        };

        $proposal = Proposal::query()->create([
            'review_analysis_run_id' => is_numeric($request->get('review_analysis_run_id'))
                ? (int) $request->get('review_analysis_run_id')
                : null,
            'type' => 'product_copy_change',
            'status' => 'pending',
            'target_type' => 'product',
            'target_id' => $product->id,
            'payload_json' => [
                'field' => $field,
                'before' => $before,
                'after' => $request->string('after')->toString(),
                'supporting_review_ids' => $request->get('supporting_review_ids') ?? [],
            ],
            'rationale' => $request->string('rationale')->toString(),
            'confidence' => (float) ($request->get('confidence') ?? 0.800),
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
            'product_slug' => $schema->string()->required(),
            'field' => $schema->string()->enum(['short_description', 'description', 'fit_note'])->required(),
            'after' => $schema->string()->required(),
            'rationale' => $schema->string()->required(),
            'confidence' => $schema->number(),
            'supporting_review_ids' => $schema->array()->items($schema->integer()),
        ];
    }
}
