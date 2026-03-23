<?php

namespace App\Console\Commands\Signals;

use App\Actions\Signals\IssueHelperTokenAction;
use App\Actions\Signals\QueueReviewAnalysisRunAction;
use App\Models\ActionLog;
use App\Models\ReviewAnalysisRun;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Symfony\Component\Process\Process;
use Throwable;

#[Signature('signals:smoke-codex-mcp
    {email=admin@example.com : Merchant admin email address}
    {--device=Signals Smoke Helper : Helper device name}
    {--server-url= : Override SIGNALS_SERVER_URL}
    {--cwd= : Override SIGNALS_CODEX_CWD}
    {--prompt= : Custom Signals prompt}
    {--run-command= : Override SIGNALS_RUN_COMMAND for a custom local smoke path}
    {--timeout=180 : Helper process timeout in seconds}')]
#[Description('Queue a Signals run, launch the local helper once, and report the resulting Codex/MCP run status.')]
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
            'Queued a Signals run from the smoke command.',
        );

        $process = new Process(
            ['node', 'desktop-helper/index.mjs'],
            base_path(),
            array_filter([
                ...$_ENV,
                ...$_SERVER,
                'SIGNALS_SERVER_URL' => rtrim((string) ($this->option('server-url') ?: config('app.url')), '/'),
                'SIGNALS_DEVICE_TOKEN' => $token['token'],
                'SIGNALS_RUN_ONCE' => '1',
                'SIGNALS_REQUIRE_RUN' => '1',
                'SIGNALS_CODEX_CWD' => $this->option('cwd') ?: null,
                'SIGNALS_RUN_COMMAND' => $this->option('run-command') ?: null,
            ], static fn (mixed $value): bool => $value !== null && $value !== ''),
        );

        $process->setTimeout((float) $this->option('timeout'));

        $this->info('Launching the Signals helper in one-shot mode...');

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
