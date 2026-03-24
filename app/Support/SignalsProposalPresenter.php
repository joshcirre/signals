<?php

namespace App\Support;

use App\Models\Product;
use App\Models\Proposal;
use App\Models\Review;

class SignalsProposalPresenter
{
    /**
     * @return array{
     *     id: int,
     *     review_analysis_run_id: int|null,
     *     type: string,
     *     status: string,
     *     target_type: string,
     *     target_id: int,
     *     target_label: string,
     *     target_slug: string|null,
     *     rationale: string,
     *     confidence: float,
     *     created_at: string|null,
     *     payload: array<string, mixed>
     * }
     */
    public static function present(Proposal $proposal): array
    {
        $targetLabel = 'Target #'.$proposal->target_id;
        $targetSlug = null;

        if ($proposal->target_type === 'product') {
            $product = Product::query()->find($proposal->target_id);
            $targetLabel = $product?->name ?? $targetLabel;
            $targetSlug = $product?->slug;
        }

        if ($proposal->target_type === 'review') {
            $review = Review::query()->with('product')->find($proposal->target_id);
            $targetLabel = $review?->product?->name
                ? $review->product->name.' review'
                : $targetLabel;
            $targetSlug = $review?->product?->slug;
        }

        return [
            'id' => $proposal->id,
            'review_analysis_run_id' => $proposal->review_analysis_run_id,
            'type' => $proposal->type,
            'status' => $proposal->status,
            'target_type' => $proposal->target_type,
            'target_id' => $proposal->target_id,
            'target_label' => $targetLabel,
            'target_slug' => $targetSlug,
            'rationale' => $proposal->rationale,
            'confidence' => (float) $proposal->confidence,
            'created_at' => $proposal->created_at?->diffForHumans(),
            'payload' => $proposal->payload_json,
        ];
    }
}
