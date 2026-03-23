<?php

namespace App\Console\Commands\ReviewOps;

use App\Actions\ReviewOps\IssueHelperTokenAction;
use App\Actions\ReviewOps\QueueReviewAnalysisRunAction;
use App\Models\ActionLog;
use App\Models\ReviewAnalysisRun;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Symfony\Component\Process\Process;
use Throwable;

#[Signature('reviewops:smoke-codex-mcp
    {email=admin@example.com : Merchant admin email address}
    {--device=ReviewOps Smoke Helper : Helper device name}
    {--server-url= : Override REVIEWOPS_SERVER_URL}
    {--cwd= : Override REVIEWOPS_CODEX_CWD}
    {--prompt= : Custom ReviewOps prompt}
    {--run-command= : Override REVIEWOPS_RUN_COMMAND for a custom local smoke path}
    {--timeout=180 : Helper process timeout in seconds}')]
#[Description('Queue a ReviewOps run, launch the local helper once, and report the resulting Codex/MCP run status.')]
class SmokeCodexMcpCommand extends Command
{
    public function handle(
        IssueHelperTokenAction $issueHelperToken,
        QueueReviewAnalysisRunAction $queueReviewAnalysisRun,
    ): int {
        $user = User::query()->where('email', $this->argument('email'))->first();

        if (! $user instanceof User) {
            $this->error('Could not find a user for the provided email address.');

            return self::FAILURE;
        }

        ReviewAnalysisRun::query()
            ->where('user_id', $user->id)
            ->whereIn('status', ['queued', 'running'])
            ->update([
                'status' => 'failed',
                'error_message' => 'Superseded by a newer smoke run.',
                'completed_at' => now(),
            ]);

        $token = $issueHelperToken->handle(
            $user,
            (string) $this->option('device'),
        );

        $run = $queueReviewAnalysisRun->handle(
            $user,
            $this->option('prompt') ?: null,
            'Queued a ReviewOps run from the smoke command.',
        );

        $process = new Process(
            ['node', 'desktop-helper/index.mjs'],
            base_path(),
            array_filter([
                ...$_ENV,
                ...$_SERVER,
                'REVIEWOPS_SERVER_URL' => rtrim((string) ($this->option('server-url') ?: config('app.url')), '/'),
                'REVIEWOPS_DEVICE_TOKEN' => $token['token'],
                'REVIEWOPS_RUN_ONCE' => '1',
                'REVIEWOPS_REQUIRE_RUN' => '1',
                'REVIEWOPS_CODEX_CWD' => $this->option('cwd') ?: null,
                'REVIEWOPS_RUN_COMMAND' => $this->option('run-command') ?: null,
            ], static fn (mixed $value): bool => $value !== null && $value !== ''),
        );

        $process->setTimeout((float) $this->option('timeout'));

        $this->info('Launching the ReviewOps helper in one-shot mode...');

        try {
            $process->run(function (string $type, string $buffer): void {
                $output = trim($buffer);

                if ($output === '') {
                    return;
                }

                if ($type === Process::ERR) {
                    $this->components->error($output);

                    return;
                }

                $this->line($output);
            });
        } catch (ProcessTimedOutException $exception) {
            $run->forceFill([
                'status' => 'failed',
                'error_message' => 'The local helper exceeded the smoke command timeout.',
                'completed_at' => now(),
            ])->save();

            $this->error($exception->getMessage());

            return self::FAILURE;
        } catch (Throwable $exception) {
            $run->forceFill([
                'status' => 'failed',
                'error_message' => $exception->getMessage(),
                'completed_at' => now(),
            ])->save();

            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $run->refresh();

        $this->newLine();
        $this->line('Run status: '.$run->status);
        $this->line('Summary: '.($run->summary ?: 'No summary returned.'));

        $recentEvents = ActionLog::query()
            ->where('review_analysis_run_id', $run->id)
            ->latest('id')
            ->limit(8)
            ->get()
            ->reverse()
            ->values();

        foreach ($recentEvents as $event) {
            $this->line(sprintf(
                '[%s] %s %s',
                $event->created_at->format('H:i:s'),
                $event->action,
                (string) ($event->metadata_json['message'] ?? ''),
            ));
        }

        if (! $process->isSuccessful() || $run->status !== 'completed') {
            $this->error($run->error_message ?: 'The smoke command did not complete successfully.');

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
