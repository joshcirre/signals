<?php

namespace App\Mcp\Tools;

use App\Models\Proposal;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Find the latest product-scoped storefront page override proposals for a given product and surface so Codex can refine an existing Arrow.js override in place instead of creating a duplicate.')]
class FindStorefrontPageOverrideProposalTool extends Tool
{
    public function handle(Request $request): Response
    {
        $productId = (int) $request->integer('product_id');
        $surface = $request->string('surface')->toString() ?: 'product_show';
        $status = $request->string('status')->toString();
        $limit = max(1, min(5, (int) ($request->get('limit') ?? 3)));

        $proposals = Proposal::query()
            ->where('type', 'storefront_page_override')
            ->where('target_type', 'product')
            ->where('target_id', $productId)
            ->where('payload_json->surface', $surface)
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->latest('updated_at')
            ->limit($limit)
            ->get();

        return Response::json([
            'proposals' => $proposals->map(fn (Proposal $proposal): array => [
                'id' => $proposal->id,
                'review_analysis_run_id' => $proposal->review_analysis_run_id,
                'status' => $proposal->status,
                'target_id' => $proposal->target_id,
                'surface' => $proposal->payload_json['surface'] ?? 'product_show',
                'title' => $proposal->payload_json['title'] ?? null,
                'arrow_source' => $proposal->payload_json['arrow_source'] ?? [],
                'rationale' => $proposal->rationale,
                'confidence' => (float) $proposal->confidence,
                'updated_at' => $proposal->updated_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'product_id' => $schema->integer()->required(),
            'surface' => $schema->string()->enum(['product_show']),
            'status' => $schema->string()->enum(['pending', 'applied', 'rejected']),
            'limit' => $schema->integer(),
        ];
    }
}
