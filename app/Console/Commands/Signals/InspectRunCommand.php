<?php

namespace App\Console\Commands\Signals;

use App\Models\Proposal;
use App\Models\ReviewAnalysisRun;
use App\Support\StorefrontPageOverrideSourceValidator;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('signals:inspect-run
    {run : Review analysis run ID}
    {--strict : Fail when the run is missing expected live adaptation links}')]
#[Description('Inspect a Signals run, its session state, linked proposals, and recent streamed events.')]
class InspectRunCommand extends Command
{
    public function handle(StorefrontPageOverrideSourceValidator $validator): int
    {
        $run = ReviewAnalysisRun::query()
            ->with(['proposals', 'followUps'])
            ->find($this->argument('run'));

        if (! $run instanceof ReviewAnalysisRun) {
            $this->error('Could not find the requested Signals run.');

            return self::FAILURE;
        }

        $this->components->info(sprintf('Signals run #%d', $run->id));
        $this->newLine();
        $this->line('Kind: '.$run->kind);
        $this->line('Status: '.$run->status);
        $this->line('Thread: '.($run->codex_thread_id ?: 'none'));
        $this->line('Session status: '.($run->codex_session_status ?: 'none'));
        $this->line('Requested: '.($run->requested_at?->toDateTimeString() ?: 'n/a'));
        $this->line('Completed: '.($run->completed_at?->toDateTimeString() ?: 'n/a'));

        $linkedOverrides = Proposal::query()
            ->where('type', 'storefront_page_override')
            ->where('review_analysis_run_id', $run->id)
            ->latest('id')
            ->get();

        $unlinkedOverrides = [];

        if ($run->kind === 'storefront_adaptation') {
            $productId = is_numeric($run->context_json['product_id'] ?? null)
                ? (int) $run->context_json['product_id']
                : null;

            if ($productId !== null) {
                $unlinkedOverrides = Proposal::query()
                    ->where('type', 'storefront_page_override')
                    ->where('target_type', 'product')
                    ->where('target_id', $productId)
                    ->whereNull('review_analysis_run_id')
                    ->latest('id')
                    ->limit(5)
                    ->get()
                    ->all();
            }
        }

        $this->newLine();
        $this->line('Linked page override proposals: '.$linkedOverrides->count());

        foreach ($linkedOverrides as $proposal) {
            $this->line(sprintf(
                '- #%d [%s] %s',
                $proposal->id,
                $proposal->status,
                (string) ($proposal->payload_json['title'] ?? 'Untitled override'),
            ));

            $errors = $validator->validate($proposal->payload_json['arrow_source'] ?? null);

            if ($errors !== []) {
                $this->line('  validation: '.implode(' ', $errors));
            }
        }

        if ($unlinkedOverrides !== []) {
            $this->components->warn('Recent unlinked page override proposals for this product:');

            foreach ($unlinkedOverrides as $proposal) {
                $this->line(sprintf(
                    '- #%d [%s] %s',
                    $proposal->id,
                    $proposal->status,
                    (string) ($proposal->payload_json['title'] ?? 'Untitled override'),
                ));
            }
        }

        $this->newLine();
        $this->line('Recent events:');

        $run->actionLogs()
            ->latest('id')
            ->limit(10)
            ->get()
            ->reverse()
            ->each(function ($event): void {
                $message = (string) ($event->metadata_json['message'] ?? $event->metadata_json['content'] ?? '');
                $this->line(sprintf(
                    '- [%s] %s %s',
                    $event->created_at->format('H:i:s'),
                    $event->action,
                    $message,
                ));
            });

        if (! $this->option('strict')) {
            return self::SUCCESS;
        }

        $issues = [];

        if ($run->codex_thread_id === null || $run->codex_session_status !== 'active') {
            $issues[] = 'Run does not have an active Codex session attached.';
        }

        if ($run->kind === 'storefront_adaptation' && ! str_contains((string) $run->prompt, 'review_analysis_run_id')) {
            $issues[] = 'Run prompt does not mention review_analysis_run_id.';
        }

        if ($run->kind === 'storefront_adaptation' && $linkedOverrides->isEmpty()) {
            $issues[] = 'Run has no linked storefront_page_override proposal.';
        }

        if ($run->kind === 'storefront_adaptation' && $linkedOverrides->isNotEmpty()) {
            $hasInvalidOverride = $linkedOverrides
                ->contains(fn (Proposal $proposal): bool => $validator->validate($proposal->payload_json['arrow_source'] ?? null) !== []);

            if ($hasInvalidOverride) {
                $issues[] = 'Run has an invalid storefront_page_override payload.';
            }
        }

        if ($issues === []) {
            $this->components->info('Strict checks passed.');

            return self::SUCCESS;
        }

        foreach ($issues as $issue) {
            $this->components->error($issue);
        }

        return self::FAILURE;
    }
}
