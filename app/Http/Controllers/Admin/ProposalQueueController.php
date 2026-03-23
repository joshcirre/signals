<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Proposal;
use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProposalQueueController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $status = $request->string('status')->toString() ?: 'pending';

        return Inertia::render('admin/proposals', [
            'filters' => [
                'status' => $status,
            ],
            'proposals' => Proposal::query()
                ->when($status !== 'all', fn ($query) => $query->where('status', $status))
                ->latest()
                ->limit(30)
                ->get()
                ->map(fn (Proposal $proposal): array => $this->payload($proposal)),
        ]);
    }

    private function payload(Proposal $proposal): array
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
            'type' => $proposal->type,
            'status' => $proposal->status,
            'target_type' => $proposal->target_type,
            'target_id' => $proposal->target_id,
            'target_label' => $targetLabel,
            'target_slug' => $targetSlug,
            'rationale' => $proposal->rationale,
            'confidence' => (float) $proposal->confidence,
            'created_at' => $proposal->created_at->diffForHumans(),
            'payload' => $proposal->payload_json,
        ];
    }
}
