<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateProposalRequest;
use App\Models\ActionLog;
use App\Models\Proposal;
use Illuminate\Http\RedirectResponse;

class ProposalUpdateController extends Controller
{
    public function __invoke(UpdateProposalRequest $request, Proposal $proposal): RedirectResponse
    {
        $payload = $proposal->payload_json ?? [];

        if ($proposal->type === 'review_response') {
            $payload['response_draft'] = $request->string('content')->toString();
        } else {
            $payload['after'] = $request->string('content')->toString();
        }

        $proposal->forceFill([
            'payload_json' => $payload,
            'rationale' => $request->string('rationale')->toString(),
            'confidence' => $request->input('confidence') ?? $proposal->confidence,
        ])->save();

        ActionLog::query()->create([
            'review_analysis_run_id' => $proposal->review_analysis_run_id,
            'actor_type' => 'human',
            'actor_id' => $request->user()->id,
            'action' => 'proposal.edited',
            'target_type' => $proposal->target_type,
            'target_id' => $proposal->target_id,
            'metadata_json' => [
                'message' => 'Edited proposal #'.$proposal->id,
                'proposal_type' => $proposal->type,
            ],
        ]);

        return back();
    }
}
