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
        $kind = in_array($normalizedKindOrPrompt, ['review_analysis', 'storefront_adaptation', 'ui_refinement'], true)
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

        if ($kind === 'ui_refinement') {
            if ($proposal === null || ! in_array($proposal->type, ['storefront_widget', 'storefront_page_override'], true)) {
                throw new InvalidArgumentException('UI refinement runs require a storefront_widget or storefront_page_override proposal.');
            }

            $payload = $proposal->payload_json ?? [];
            $existingSource = isset($payload['arrow_source']) ? json_encode($payload['arrow_source'], JSON_PRETTY_PRINT) : '{}';
            $normalizedFocus = is_string($focus) ? mb_trim($focus) : '';
            $title = is_string($payload['title'] ?? null) ? $payload['title'] : 'Storefront widget';

            if ($proposal->type === 'storefront_page_override') {
                $surface = is_string($payload['surface'] ?? null) ? $payload['surface'] : 'product_show';
                $title = is_string($payload['title'] ?? null) ? $payload['title'] : 'Storefront page override';

                $prompt = "You are refining an existing live storefront page override built with Arrow.js.\n\n"
                    ."Page override proposal ID: {$proposal->id}\n"
                    ."Surface: {$surface}\n"
                    ."Title: {$title}\n\n"
                    ."Current Arrow source:\n{$existingSource}\n\n"
                    .($normalizedFocus !== '' ? "Requested changes: {$normalizedFocus}\n\n" : '')
                    ."Call create_storefront_page_override_proposal_tool with the updated arrow_source and proposal_id={$proposal->id} to push changes live. Keep the same product target and surface unless explicitly changed. The runtime provides a ./signals.ts module with product, reviews, storefront, and formatPrice exports.";

                return [
                    'prompt' => $prompt,
                    'message' => 'Queued a UI refinement run — Codex will update the page override live.',
                    'context_json' => [
                        'arrow_proposal_id' => $proposal->id,
                        'product_id' => $proposal->target_id,
                        'product_slug' => Product::query()->find($proposal->target_id)?->slug,
                        'surface' => $surface,
                        'title' => $title,
                        'focus' => $normalizedFocus ?: null,
                    ],
                ];
            }

            $position = is_string($payload['position'] ?? null) ? $payload['position'] : 'below_products';

            $prompt = "You are refining an existing live storefront UI widget built with Arrow.js.\n\n"
                ."Widget proposal ID: {$proposal->id}\n"
                ."Position: {$position}\n"
                ."Title: {$title}\n\n"
                ."Current Arrow source:\n{$existingSource}\n\n"
                .($normalizedFocus !== '' ? "Requested changes: {$normalizedFocus}\n\n" : '')
                ."Call create_storefront_widget_proposal_tool with the updated arrow_source and proposal_id={$proposal->id} to push changes live. Keep the position and title unless explicitly changed.";

            return [
                'prompt' => $prompt,
                'message' => 'Queued a UI refinement run — Codex will update the widget live.',
                'context_json' => [
                    'arrow_proposal_id' => $proposal->id,
                    'position' => $position,
                    'title' => $title,
                    'focus' => $normalizedFocus ?: null,
                ],
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
        $normalizedFocus = is_string($focus) ? mb_trim($focus) : '';
        $surface = 'product_show';

        $prompt = "Start a second Codex session for the {$product->name} storefront product page.\n\n"
            ."Use the latest Signals review evidence plus pending proposal #{$proposal->id} for {$field} to create or refine a product-scoped live Arrow.js page override proposal that makes the guidance more noticeable on the storefront.\n\n"
            ."Requirements:\n"
            ."- Do not edit shared Laravel or React storefront files.\n"
            ."- Use create_storefront_page_override_proposal_tool to create the live storefront change.\n"
            ."- Pass the current review_analysis_run_id when calling the tool so live proposal updates stream back into Signals.\n"
            ."- Target product_id={$product->id} and surface=\"{$surface}\".\n"
            ."- Keep the page override grounded in the proposal copy and supporting reviews instead of inventing new claims.\n"
            ."- Prefer replacing the full product detail experience for this one product instead of editing a small global widget.\n"
            ."- The runtime provides a ./signals.ts module with product, reviews, storefront, and formatPrice exports.\n"
            ."- If you refine an existing storefront_page_override proposal, update it in place with proposal_id.\n\n"
            ."Pending proposal copy:\n"
            .($after ?? 'No replacement copy was provided.')."\n\n"
            .'Supporting review IDs: '
            .json_encode($proposalPayload['supporting_review_ids'] ?? [])
            ."\n";

        if ($normalizedFocus !== '') {
            $prompt .= "\nRequested emphasis: {$normalizedFocus}\n";
        }

        return [
            'prompt' => $prompt,
            'message' => 'Queued a storefront adaptation run — Codex will create a live Arrow.js page override proposal.',
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
                'preferred_override_surface' => $surface,
                'focus' => $normalizedFocus !== '' ? $normalizedFocus : null,
            ],
        ];
    }
}
