<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActionLog;
use App\Models\Product;
use App\Models\Proposal;
use App\Models\Review;
use App\Models\ReviewAnalysisRun;
use App\Support\SignalsProposalPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewAnalysisRunShowController extends Controller
{
    public function __invoke(Request $request, ReviewAnalysisRun $reviewAnalysisRun): Response
    {
        abort_if($reviewAnalysisRun->user_id !== $request->user()?->id, 404);

        $proposal = $this->proposal($reviewAnalysisRun);
        $previewContext = $this->previewContext($reviewAnalysisRun, $proposal);

        return Inertia::render('admin/review-runs/show', [
            'run' => [
                'id' => $reviewAnalysisRun->id,
                'status' => $reviewAnalysisRun->status,
                'kind' => $reviewAnalysisRun->kind,
                'summary' => $reviewAnalysisRun->summary,
                'prompt' => $reviewAnalysisRun->prompt,
                'context' => $reviewAnalysisRun->context_json,
                'error_message' => $reviewAnalysisRun->error_message,
                'codex_thread_id' => $reviewAnalysisRun->codex_thread_id,
                'codex_session_status' => $reviewAnalysisRun->codex_session_status,
                'requested_at' => $reviewAnalysisRun->requested_at?->toIso8601String(),
                'started_at' => $reviewAnalysisRun->started_at?->toIso8601String(),
                'completed_at' => $reviewAnalysisRun->completed_at?->toIso8601String(),
                'events' => $reviewAnalysisRun->actionLogs()
                    ->oldest()
                    ->limit(250)
                    ->get()
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
            ],
            'proposal' => $proposal ? SignalsProposalPresenter::present($proposal) : null,
            'preview_context' => $previewContext,
        ]);
    }

    private function proposal(ReviewAnalysisRun $reviewAnalysisRun): ?Proposal
    {
        $context = $reviewAnalysisRun->context_json ?? [];
        $proposalId = is_numeric($context['arrow_proposal_id'] ?? null)
            ? (int) $context['arrow_proposal_id']
            : null;

        if ($proposalId !== null) {
            return Proposal::query()->find($proposalId);
        }

        return $reviewAnalysisRun->proposals()
            ->whereIn('type', ['storefront_widget', 'storefront_page_override'])
            ->latest('id')
            ->first();
    }

    /**
     * @return array{product: array<string, mixed>, reviews: array<int, array<string, mixed>>, store_brand_name: string}|null
     */
    private function previewContext(ReviewAnalysisRun $reviewAnalysisRun, ?Proposal $proposal): ?array
    {
        $context = $reviewAnalysisRun->context_json ?? [];
        $productId = $proposal?->target_type === 'product'
            ? $proposal->target_id
            : (is_numeric($context['product_id'] ?? null) ? (int) $context['product_id'] : null);

        if ($productId === null) {
            return null;
        }

        $product = Product::query()
            ->with([
                'reviews' => fn ($query) => $query->latest('reviewed_at'),
            ])
            ->find($productId);

        if ($product === null) {
            return null;
        }

        return [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'category' => $product->category,
                'price_cents' => $product->price_cents,
                'hero_image_url' => $product->hero_image_url,
                'short_description' => $product->short_description,
                'description' => $product->description,
                'fit_note' => $product->fit_note,
                'faq_items' => $product->faq_items ?? [],
                'average_rating' => round((float) $product->reviews->avg('rating'), 1),
                'review_count' => $product->reviews->count(),
            ],
            'reviews' => $product->reviews
                ->map(fn (Review $review): array => [
                    'id' => $review->id,
                    'author_name' => $review->author_name,
                    'rating' => $review->rating,
                    'title' => $review->title,
                    'body' => $review->body,
                    'reviewed_at' => $review->reviewed_at?->toDateString(),
                    'approved_response' => $review->response_draft_status === 'approved'
                        ? $review->response_draft
                        : null,
                    'response_approved_at' => $review->response_draft_status === 'approved'
                        ? $review->response_draft_approved_at?->toDateString()
                        : null,
                ])
                ->all(),
            'store_brand_name' => config('app.name'),
        ];
    }
}
