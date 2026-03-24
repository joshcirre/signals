<?php

namespace App\Mcp\Resources;

use App\Models\Proposal;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Uri;
use Laravel\Mcp\Server\Resource;

#[Uri('signals://pending-proposals')]
#[Description('A JSON snapshot of the currently pending merchant-facing proposals.')]
class PendingProposalsResource extends Resource
{
    public function handle(Request $request): Response
    {
        $proposals = Proposal::query()
            ->where('status', 'pending')
            ->latest()
            ->limit(10)
            ->get([
                'id',
                'review_analysis_run_id',
                'type',
                'target_type',
                'target_id',
                'payload_json',
                'rationale',
                'confidence',
            ]);

        return Response::json([
            'pending_proposals' => $proposals,
        ]);
    }
}
