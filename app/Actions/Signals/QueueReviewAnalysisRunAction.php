<?php

namespace App\Actions\Signals;

use App\Events\ReviewAnalysisEventBroadcast;
use App\Events\ReviewAnalysisRunUpdated;
use App\Models\ActionLog;
use App\Models\Product;
use App\Models\Proposal;
use App\Models\ReviewAnalysisRun;
use App\Models\User;
use InvalidArgumentException;
use Throwable;

class QueueReviewAnalysisRunAction
{
    public function handle(
        User $user,
        ?string $kindOrPrompt = 'review_analysis',
        Proposal|string|null $proposalOrMessage = null,
        ?string $message = null,
        ?string $focus = null,
    ): ReviewAnalysisRun {
        $normalizedKindOrPrompt = $kindOrPrompt ?? 'review_analysis';
        $kind = in_array($normalizedKindOrPrompt, ['review_analysis', 'storefront_adaptation'], true)
            ? $normalizedKindOrPrompt
            : 'review_analysis';
        $promptOverride = $kind === $normalizedKindOrPrompt
            ? null
            : $normalizedKindOrPrompt;
        $proposal = $proposalOrMessage instanceof Proposal
            ? $proposalOrMessage
            : null;
        $queueMessage = is_string($proposalOrMessage) ? $proposalOrMessage : $message;
        $queuedRun = $this->queuedRunAttributes(
            $kind,
            $proposal,
            $promptOverride,
            $focus,
        );

        $run = ReviewAnalysisRun::query()->create([
            'user_id' => $user->id,
            'status' => 'queued',
            'kind' => $kind,
            'prompt' => $queuedRun['prompt'],
            'context_json' => $queuedRun['context_json'],
            'requested_at' => now(),
        ]);

        $event = ActionLog::query()->create([
            'review_analysis_run_id' => $run->id,
            'actor_type' => 'system',
            'action' => 'run.queued',
            'metadata_json' => [
                'message' => $queueMessage ?: $queuedRun['message'],
            ],
        ]);

        try {
            event(new ReviewAnalysisRunUpdated($run));
            event(new ReviewAnalysisEventBroadcast($user, $event));
        } catch (Throwable $throwable) {
            report($throwable);
        }

        return $run;
    }

    /**
     * @return array{prompt: string, message: string, context_json: array<string, mixed>|null}
     */
    private function queuedRunAttributes(
        string $kind,
        ?Proposal $proposal,
        ?string $promptOverride = null,
        ?string $focus = null,
    ): array {
        if ($kind === 'review_analysis') {
            $basePrompt = 'Analyze the latest apparel reviews, confirm any repeated fit problems, and prepare only merchant-facing proposals with a strong preference for a single fit-note update when the evidence is clear.';
            $normalizedFocus = is_string($focus) ? mb_trim($focus) : '';

            if (is_string($promptOverride) && $promptOverride !== '') {
                return [
                    'prompt' => $promptOverride,
                    'message' => 'Queued Signals run and waiting for a connected local helper to claim it.',
                    'context_json' => $normalizedFocus === ''
                        ? null
                        : ['focus' => $normalizedFocus],
                ];
            }

            return [
                'prompt' => $normalizedFocus === ''
                    ? $basePrompt
                    : $basePrompt."\n\nFocus area: ".$normalizedFocus,
                'message' => $normalizedFocus === ''
                    ? 'Queued Signals run and waiting for a connected local helper to claim it.'
                    : 'Queued a focused Signals run and waiting for a connected local helper to claim it.',
                'context_json' => $normalizedFocus === ''
                    ? null
                    : ['focus' => $normalizedFocus],
            ];
        }

        if ($kind !== 'storefront_adaptation') {
            throw new InvalidArgumentException('Unsupported Signals run kind.');
        }

        if ($proposal === null || $proposal->type !== 'product_copy_change' || $proposal->target_type !== 'product') {
            throw new InvalidArgumentException('Storefront adaptation runs require a pending product copy proposal.');
        }

        $product = Product::query()->findOrFail($proposal->target_id);
        $proposalPayload = $proposal->payload_json ?? [];
        $field = is_string($proposalPayload['field'] ?? null) ? $proposalPayload['field'] : 'fit_note';
        $after = is_string($proposalPayload['after'] ?? null) ? $proposalPayload['after'] : null;

        return [
            'prompt' => sprintf(
                'Start a second Codex session for the %s product page. Use the latest Signals review evidence and the pending %s proposal to adapt the storefront experience so the key guidance is easier to notice.',
                $product->name,
                str_replace('_', ' ', $field),
            ),
            'message' => 'Queued a storefront adaptation run and waiting for the local helper to open a coding session.',
            'context_json' => [
                'product_id' => $product->id,
                'product_slug' => $product->slug,
                'product_name' => $product->name,
                'proposal_id' => $proposal->id,
                'proposal_type' => $proposal->type,
                'proposal_field' => $field,
                'proposal_after' => $after,
                'proposal_rationale' => $proposal->rationale,
                'proposal_confidence' => (float) $proposal->confidence,
                'supporting_review_ids' => $proposalPayload['supporting_review_ids'] ?? [],
            ],
        ];
    }
}
