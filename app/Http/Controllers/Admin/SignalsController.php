<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Signals\IssueHelperTokenAction;
use App\Http\Controllers\Controller;
use App\Models\ActionLog;
use App\Models\Product;
use App\Models\Proposal;
use App\Models\Review;
use App\Models\ReviewAnalysisRun;
use App\Models\ReviewCluster;
use App\Models\SignalsDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SignalsController extends Controller
{
    public function index(Request $request, IssueHelperTokenAction $issueHelperToken): Response
    {
        $search = mb_trim($request->string('q')->toString());
        $terms = $this->expandedSearchTerms($search);
        $user = $request->user();
        $helperToken = $request->session()->get('helper_token');
        $helperName = $request->session()->get('helper_name', 'Signals Helper');

        if ($user !== null && ! is_string($helperToken)) {
            $token = $issueHelperToken->handle($user, 'Signals Helper');
            $helperToken = $token['token'];
            $helperName = $token['device']->name;

            $request->session()->put([
                'helper_token' => $helperToken,
                'helper_name' => $helperName,
            ]);
        }

        $latestRun = ReviewAnalysisRun::query()
            ->where('user_id', $user?->id)
            ->with('actionLogs')
            ->latest()
            ->first();

        $reviews = Review::query()
            ->with(['product.reviewClusters', 'tagAssignments.reviewTag'])
            ->latest('reviewed_at')
            ->limit($search === '' ? 12 : 40)
            ->get()
            ->map(function (Review $review) use ($search, $terms): array {
                $signals = $this->reviewSignals($review, $search, $terms);

                return [
                    'id' => $review->id,
                    'product' => $review->product?->name,
                    'rating' => $review->rating,
                    'title' => $review->title,
                    'body' => $review->body,
                    'reviewed_at' => $review->reviewed_at?->toDateString(),
                    'sentiment' => $this->sentimentForReview($review),
                    'severity' => $this->severityForReview($review),
                    'response_draft' => $review->response_draft,
                    'response_draft_status' => $review->response_draft_status,
                    'tags' => $review->tagAssignments->map(fn ($assignment): array => [
                        'name' => $assignment->reviewTag?->normalized_name,
                        'confidence' => (float) $assignment->confidence,
                    ])->values(),
                    'matched_because' => $signals['reasons'],
                    'match_score' => $signals['score'],
                ];
            })
            ->when($search !== '', fn (Collection $collection) => $collection
                ->filter(fn (array $review): bool => $review['match_score'] > 0)
                ->sortByDesc('match_score')
                ->values()
                ->take(12))
            ->values();

        $clusters = ReviewCluster::query()
            ->with('product')
            ->latest('review_count')
            ->limit(12)
            ->get()
            ->map(function (ReviewCluster $cluster) use ($search, $terms): array {
                $signals = $this->clusterSignals($cluster, $search, $terms);

                return [
                    'id' => $cluster->id,
                    'product' => $cluster->product?->name,
                    'title' => $cluster->title,
                    'summary' => $cluster->summary,
                    'severity' => $cluster->severity,
                    'review_count' => $cluster->review_count,
                    'matched_because' => $signals['reasons'],
                    'match_score' => $signals['score'],
                ];
            })
            ->when($search !== '', fn (Collection $collection) => $collection
                ->filter(fn (array $cluster): bool => $cluster['match_score'] > 0)
                ->sortByDesc('match_score')
                ->values()
                ->take(6))
            ->values();

        return Inertia::render('admin/signals', [
            'filters' => [
                'q' => $search,
            ],
            'helper' => [
                'default_name' => 'Signals Helper',
                'latest_device_seen_at' => SignalsDevice::query()
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
                    ->map(fn (ActionLog $actionLog): array => [
                        'id' => $actionLog->id,
                        'review_analysis_run_id' => $actionLog->review_analysis_run_id,
                        'action' => $actionLog->action,
                        'actor_type' => $actionLog->actor_type,
                        'kind' => $actionLog->metadata_json['kind'] ?? null,
                        'content' => $actionLog->metadata_json['content'] ?? ($actionLog->metadata_json['message'] ?? null),
                        'tool_id' => $actionLog->metadata_json['tool_id'] ?? null,
                        'tool_name' => $actionLog->metadata_json['tool_name'] ?? null,
                        'item_id' => $actionLog->metadata_json['item_id'] ?? null,
                        'is_error' => (bool) ($actionLog->metadata_json['is_error'] ?? false),
                        'metadata' => $actionLog->metadata_json ?? [],
                        'created_at' => $actionLog->created_at->toIso8601String(),
                    ]),
            ] : null,
            'pendingProposals' => Proposal::query()
                ->where('status', 'pending')
                ->latest()
                ->limit(8)
                ->get()
                ->map(fn (Proposal $proposal): array => $this->proposalPayload($proposal)),
            'products' => Product::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->map(fn (Product $product): array => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                ]),
            'reviews' => $reviews,
            'clusters' => $clusters,
            'recentAuditLog' => ActionLog::query()
                ->latest()
                ->limit(8)
                ->get()
                ->map(fn (ActionLog $actionLog): array => [
                    'id' => $actionLog->id,
                    'action' => $actionLog->action,
                    'actor_type' => $actionLog->actor_type,
                    'message' => $actionLog->metadata_json['message'] ?? null,
                    'created_at' => $actionLog->created_at->diffForHumans(),
                ]),
        ]);
    }

    /**
     * @return array{score: int, reasons: array<int, string>}
     */
    private function reviewSignals(Review $review, string $search, array $terms): array
    {
        $score = 0;
        $reasons = [];

        if ($search === '') {
            return [
                'score' => 1,
                'reasons' => ['Recent review with merchant-facing signal'],
            ];
        }

        $haystack = Str::lower(implode(' ', array_filter([
            $review->title,
            $review->body,
        ])));

        if ($haystack !== '' && Str::contains($haystack, Str::lower($search))) {
            $score += 6;
            $reasons[] = 'Direct review text match';
        }

        foreach ($terms as $term) {
            if (Str::contains($haystack, $term)) {
                $score += 2;
                $reasons[] = 'Matched review language like "'.$term.'"';
                break;
            }
        }

        if ($review->product !== null) {
            $productText = Str::lower(implode(' ', array_filter([
                $review->product->name,
                $review->product->category,
                $review->product->short_description,
            ])));

            foreach ($terms as $term) {
                if (Str::contains($productText, $term)) {
                    $score += 3;
                    $reasons[] = 'Product match: '.$review->product->name;
                    break;
                }
            }

            foreach ($review->product->reviewClusters as $cluster) {
                $clusterText = Str::lower($cluster->title.' '.$cluster->summary);

                foreach ($terms as $term) {
                    if (Str::contains($clusterText, $term)) {
                        $score += 3;
                        $reasons[] = 'Cluster match: '.$cluster->title;
                        break 2;
                    }
                }
            }
        }

        foreach ($review->tagAssignments as $assignment) {
            $tag = $assignment->reviewTag?->normalized_name;

            if ($tag === null) {
                continue;
            }

            $tagText = Str::lower($tag);

            foreach ($terms as $term) {
                if (Str::contains($tagText, $term)) {
                    $score += 4;
                    $reasons[] = 'Hidden tag match: '.$tag;
                    break 2;
                }
            }
        }

        if ($review->rating <= 2) {
            $score += 1;
            $reasons[] = 'Low rating review';
        }

        if ($reasons === []) {
            $reasons[] = 'Related merchant signal';
        }

        return [
            'score' => $score,
            'reasons' => collect($reasons)->unique()->values()->all(),
        ];
    }

    /**
     * @return array{score: int, reasons: array<int, string>}
     */
    private function clusterSignals(ReviewCluster $cluster, string $search, array $terms): array
    {
        $score = 0;
        $reasons = [];

        if ($search === '') {
            return [
                'score' => 1,
                'reasons' => ['Existing hidden complaint cluster'],
            ];
        }

        $haystack = Str::lower(implode(' ', array_filter([
            $cluster->title,
            $cluster->summary,
            $cluster->product?->name,
        ])));

        if (Str::contains($haystack, Str::lower($search))) {
            $score += 5;
            $reasons[] = 'Direct cluster summary match';
        }

        foreach ($terms as $term) {
            if (Str::contains($haystack, $term)) {
                $score += 2;
                $reasons[] = 'Matched cluster language like "'.$term.'"';
                break;
            }
        }

        if ($cluster->product !== null) {
            foreach ($terms as $term) {
                if (Str::contains(Str::lower($cluster->product->name), $term)) {
                    $score += 2;
                    $reasons[] = 'Product match: '.$cluster->product->name;
                    break;
                }
            }
        }

        return [
            'score' => $score,
            'reasons' => collect($reasons)->unique()->values()->all(),
        ];
    }

    private function sentimentForReview(Review $review): string
    {
        return match (true) {
            $review->rating >= 4 => 'positive',
            $review->rating === 3 => 'mixed',
            default => 'negative',
        };
    }

    private function severityForReview(Review $review): string
    {
        return match (true) {
            $review->rating <= 2 => 'high',
            $review->rating === 3 => 'medium',
            default => 'low',
        };
    }

    private function proposalPayload(Proposal $proposal): array
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
            'payload' => $proposal->payload_json,
        ];
    }

    /**
     * @return array<int, string>
     */
    private function expandedSearchTerms(string $search): array
    {
        if ($search === '') {
            return [];
        }

        $tokens = collect(preg_split('/\s+/', Str::lower($search)) ?: [])
            ->map(fn (string $token): string => preg_replace('/[^a-z0-9]/', '', $token) ?: '')
            ->filter(fn (string $token): bool => $token !== '' && ! in_array($token, [
                'show',
                'me',
                'about',
                'for',
                'the',
                'and',
                'with',
                'reviews',
                'review',
            ], true));

        $aliases = [
            'sizing' => ['size', 'small', 'tiny', 'tight', 'fit'],
            'fit' => ['sizing', 'small', 'tight'],
            'shipping' => ['delay', 'late', 'delayed'],
            'comfort' => ['comfortable', 'soft', 'softness'],
            'quality' => ['quality', 'stitching', 'material'],
            'packaging' => ['box', 'broken', 'chipped', 'arrival'],
            'mug' => ['ceramic', 'cup'],
            'hoodie' => ['hoodie', 'premium'],
        ];

        foreach ($tokens->all() as $token) {
            if (array_key_exists($token, $aliases)) {
                $tokens = $tokens->merge($aliases[$token]);
            }
        }

        return $tokens
            ->unique()
            ->values()
            ->all();
    }
}
