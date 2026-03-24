<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActionLog;
use App\Models\Product;
use App\Models\Proposal;
use App\Models\Review;
use App\Models\StorefrontPageOverride;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProposalApprovalController extends Controller
{
    public function __invoke(Request $request, Proposal $proposal): RedirectResponse
    {
        if ($proposal->type === 'product_copy_change' && $proposal->target_type === 'product') {
            $product = Product::query()->findOrFail($proposal->target_id);
            $field = $proposal->payload_json['field'] ?? null;

            if (in_array($field, ['fit_note', 'short_description', 'description'], true)) {
                $product->forceFill([
                    $field => $proposal->payload_json['after'] ?? $product->{$field},
                ])->save();
            }
        }

        if ($proposal->type === 'storefront_widget') {
            // Arrow source is stored in payload_json; no extra DB write needed.
            // The storefront reads directly from applied proposals.
        }

        if ($proposal->type === 'storefront_page_override' && $proposal->target_type === 'product') {
            $payload = $proposal->payload_json ?? [];

            StorefrontPageOverride::query()->updateOrCreate(
                [
                    'product_id' => $proposal->target_id,
                    'surface' => is_string($payload['surface'] ?? null) ? $payload['surface'] : 'product_show',
                ],
                [
                    'title' => is_string($payload['title'] ?? null) ? $payload['title'] : null,
                    'arrow_source_json' => $payload['arrow_source'] ?? [],
                    'approved_by' => $request->user()->id,
                    'created_from_proposal_id' => $proposal->id,
                    'created_from_run_id' => $proposal->review_analysis_run_id,
                    'approved_at' => now(),
                ],
            );
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
