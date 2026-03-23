<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActionLog;
use App\Models\Product;
use App\Models\Proposal;
use App\Models\Review;
use App\Models\ReviewAnalysisRun;
use App\Models\ReviewOpsDevice;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewOpsController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('q')->toString();
        $user = $request->user();
        $latestRun = ReviewAnalysisRun::query()
            ->with('actionLogs')
            ->latest()
            ->first();

        $reviews = Review::query()
            ->with(['product', 'tagAssignments.reviewTag'])
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $builder) use ($search) {
                    $builder
                        ->where('title', 'like', '%'.$search.'%')
                        ->orWhere('body', 'like', '%'.$search.'%')
                        ->orWhereHas('product', fn (Builder $productQuery) => $productQuery->where('name', 'like', '%'.$search.'%'))
                        ->orWhereHas('tagAssignments.reviewTag', fn (Builder $tagQuery) => $tagQuery->where('normalized_name', 'like', '%'.$search.'%'));
                });
            })
            ->latest('reviewed_at')
            ->limit(12)
            ->get()
            ->map(fn (Review $review) => [
                'id' => $review->id,
                'product' => $review->product?->name,
                'rating' => $review->rating,
                'title' => $review->title,
                'body' => $review->body,
                'reviewed_at' => $review->reviewed_at?->toDateString(),
                'tags' => $review->tagAssignments->map(fn ($assignment) => [
                    'name' => $assignment->reviewTag?->normalized_name,
                    'confidence' => (float) $assignment->confidence,
                ])->values(),
                'matched_because' => $this->matchedBecause($review, $search),
            ]);

        return Inertia::render('admin/review-ops', [
            'filters' => [
                'q' => $search,
            ],
            'helper' => [
                'default_name' => 'ReviewOps Helper',
                'latest_device_seen_at' => ReviewOpsDevice::query()
                    ->where('user_id', $user?->id)
                    ->latest('last_seen_at')
                    ->value('last_seen_at'),
            ],
            'latestRun' => $latestRun ? [
                'id' => $latestRun->id,
                'status' => $latestRun->status,
                'summary' => $latestRun->summary,
                'prompt' => $latestRun->prompt,
                'requested_at' => $latestRun->requested_at?->toIso8601String(),
                'events' => $latestRun->actionLogs()
                    ->latest()
                    ->limit(20)
                    ->get()
                    ->reverse()
                    ->values()
                    ->map(fn (ActionLog $actionLog) => [
                        'id' => $actionLog->id,
                        'action' => $actionLog->action,
                        'actor_type' => $actionLog->actor_type,
                        'metadata' => $actionLog->metadata_json ?? [],
                        'created_at' => $actionLog->created_at->toIso8601String(),
                    ]),
            ] : null,
            'pendingProposals' => Proposal::query()
                ->where('status', 'pending')
                ->latest()
                ->limit(6)
                ->get()
                ->map(fn (Proposal $proposal) => [
                    'id' => $proposal->id,
                    'type' => $proposal->type,
                    'status' => $proposal->status,
                    'target_type' => $proposal->target_type,
                    'target_id' => $proposal->target_id,
                    'rationale' => $proposal->rationale,
                    'confidence' => (float) $proposal->confidence,
                    'payload' => $proposal->payload_json,
                ]),
            'products' => Product::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->map(fn (Product $product) => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                ]),
            'reviews' => $reviews,
        ]);
    }

    private function matchedBecause(Review $review, string $search): array
    {
        $reasons = [];

        if ($search !== '' && str_contains(strtolower($review->body), strtolower($search))) {
            $reasons[] = 'Direct review text match';
        }

        if ($search !== '' && $review->product !== null && str_contains(strtolower($review->product->name), strtolower($search))) {
            $reasons[] = 'Product name overlap';
        }

        foreach ($review->tagAssignments as $assignment) {
            $tag = $assignment->reviewTag?->normalized_name;

            if ($tag !== null) {
                $reasons[] = 'Hidden tag match: '.$tag;
                break;
            }
        }

        if ($reasons === []) {
            $reasons[] = 'Recent review with merchant-facing signal';
        }

        return $reasons;
    }
}
