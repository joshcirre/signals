<?php

namespace App\Mcp\Tools;

use App\Events\ProposalUpdated;
use App\Models\Proposal;
use App\Models\ReviewAnalysisRun;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Create or update a product-scoped live storefront page override proposal using Arrow.js source code. The approved override replaces the product detail experience with an Arrow sandbox render for that product page.')]
class CreateStorefrontPageOverrideProposalTool extends Tool
{
    public function handle(Request $request): Response
    {
        $proposalId = $request->get('proposal_id');
        $runId = is_numeric($request->get('review_analysis_run_id'))
            ? (int) $request->get('review_analysis_run_id')
            : null;
        $productId = (int) $request->integer('product_id');
        $surface = $request->string('surface')->toString();
        $arrowSource = $request->get('arrow_source');

        if (! is_array($arrowSource) || ! isset($arrowSource['main.ts'])) {
            return Response::error('arrow_source must be an object containing at least a "main.ts" key.');
        }

        $payload = [
            'surface' => $surface,
            'title' => $request->string('title')->toString(),
            'arrow_source' => $arrowSource,
        ];

        if ($proposalId !== null && is_numeric($proposalId)) {
            $proposal = Proposal::query()
                ->where('id', (int) $proposalId)
                ->where('type', 'storefront_page_override')
                ->where('target_type', 'product')
                ->first();

            if ($proposal !== null) {
                $proposal->forceFill([
                    'review_analysis_run_id' => $runId,
                    'target_id' => $productId,
                    'payload_json' => $payload,
                    'rationale' => $request->string('rationale')->toString(),
                    'confidence' => (float) ($request->get('confidence') ?? 0.850),
                    'status' => 'pending',
                ])->save();

                $this->broadcast($proposal, $runId);

                return Response::json([
                    'proposal_id' => $proposal->id,
                    'action' => 'updated',
                    'status' => $proposal->status,
                ]);
            }
        }

        $proposal = Proposal::query()->create([
            'review_analysis_run_id' => $runId,
            'type' => 'storefront_page_override',
            'status' => 'pending',
            'target_type' => 'product',
            'target_id' => $productId,
            'payload_json' => $payload,
            'rationale' => $request->string('rationale')->toString(),
            'confidence' => (float) ($request->get('confidence') ?? 0.850),
            'created_by' => 'agent',
        ]);

        $this->broadcast($proposal, $runId);

        return Response::json([
            'proposal_id' => $proposal->id,
            'action' => 'created',
            'status' => $proposal->status,
        ]);
    }

    private function broadcast(Proposal $proposal, ?int $runId): void
    {
        if ($runId === null) {
            return;
        }

        $run = ReviewAnalysisRun::query()->find($runId);

        if ($run === null) {
            return;
        }

        event(new ProposalUpdated($proposal, $run->user_id));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'review_analysis_run_id' => $schema->integer(),
            'proposal_id' => $schema->integer(),
            'product_id' => $schema->integer()->required(),
            'surface' => $schema->string()->enum(['product_show'])->required(),
            'title' => $schema->string()->required(),
            'arrow_source' => $schema->object([
                'main.ts' => $schema->string()->required(),
                'main.css' => $schema->string(),
            ])->required(),
            'rationale' => $schema->string()->required(),
            'confidence' => $schema->number(),
        ];
    }
}
