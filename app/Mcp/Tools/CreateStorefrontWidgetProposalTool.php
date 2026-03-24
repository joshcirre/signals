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

#[Description('Create or update a live storefront UI widget proposal using Arrow.js source code. The widget renders inside an Arrow sandbox on the storefront once approved. Pass an existing proposal_id to refine a previous widget instead of creating a new one.')]
class CreateStorefrontWidgetProposalTool extends Tool
{
    public function handle(Request $request): Response
    {
        $proposalId = $request->get('proposal_id');
        $runId = is_numeric($request->get('review_analysis_run_id'))
            ? (int) $request->get('review_analysis_run_id')
            : null;

        $arrowSource = $request->get('arrow_source');

        if (! is_array($arrowSource) || ! isset($arrowSource['main.ts'])) {
            return Response::error('arrow_source must be an object containing at least a "main.ts" key.');
        }

        $payload = [
            'position' => $request->string('position')->toString(),
            'title' => $request->string('title')->toString(),
            'arrow_source' => $arrowSource,
        ];

        if ($proposalId !== null && is_numeric($proposalId)) {
            $proposal = Proposal::query()
                ->where('id', (int) $proposalId)
                ->where('type', 'storefront_widget')
                ->first();

            if ($proposal !== null) {
                $proposal->forceFill([
                    'review_analysis_run_id' => $runId,
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
            'type' => 'storefront_widget',
            'status' => 'pending',
            'target_type' => 'storefront',
            'target_id' => 0,
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
            'position' => $schema->string()
                ->enum(['hero', 'below_products', 'product_card'])
                ->required(),
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
