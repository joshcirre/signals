<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActionLog;
use App\Models\Product;
use App\Models\Proposal;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProposalApprovalController extends Controller
{
    public function __invoke(Request $request, Proposal $proposal): RedirectResponse
    {
        if ($proposal->type === 'product_copy_change' && $proposal->target_type === 'product') {
            $product = Product::query()->findOrFail($proposal->target_id);
            $field = $proposal->payload_json['field'] ?? null;

            if ($field === 'fit_note') {
                $product->forceFill([
                    'fit_note' => $proposal->payload_json['after'] ?? $product->fit_note,
                ])->save();
            }
        }

        if ($proposal->type === 'review_response' && $proposal->target_type === 'review') {
            $review = Review::query()->findOrFail($proposal->target_id);

            $review->forceFill([
                'response_draft' => $proposal->payload_json['response_draft'] ?? $review->response_draft,
                'response_draft_status' => 'approved',
                'response_draft_approved_at' => now(),
            ])->save();
        }

        $proposal->forceFill([
            'status' => 'applied',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'applied_at' => now(),
        ])->save();

        ActionLog::query()->create([
            'review_analysis_run_id' => $proposal->review_analysis_run_id,
            'actor_type' => 'human',
            'actor_id' => $request->user()->id,
            'action' => 'proposal.approved',
            'target_type' => $proposal->target_type,
            'target_id' => $proposal->target_id,
            'metadata_json' => [
                'message' => 'Approved and applied proposal #'.$proposal->id,
                'proposal_type' => $proposal->type,
            ],
        ]);

        return back();
    }
}
