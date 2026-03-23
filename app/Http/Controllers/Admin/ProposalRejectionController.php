<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActionLog;
use App\Models\Proposal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProposalRejectionController extends Controller
{
    public function __invoke(Request $request, Proposal $proposal): RedirectResponse
    {
        $proposal->forceFill([
            'status' => 'rejected',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ])->save();

        ActionLog::query()->create([
            'review_analysis_run_id' => $proposal->review_analysis_run_id,
            'actor_type' => 'human',
            'actor_id' => $request->user()->id,
            'action' => 'proposal.rejected',
            'target_type' => $proposal->target_type,
            'target_id' => $proposal->target_id,
            'metadata_json' => [
                'message' => 'Rejected proposal #'.$proposal->id,
                'proposal_type' => $proposal->type,
            ],
        ]);

        return back();
    }
}
