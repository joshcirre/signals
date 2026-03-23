<?php

namespace App\Console\Commands\Signals;

use App\Actions\Signals\QueueReviewAnalysisRunAction;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('signals:queue-demo-run
    {email=admin@example.com : Merchant admin email address}
    {--prompt= : Custom Signals prompt}
    {--message= : Custom queue event message}')]
#[Description('Queue a Signals analysis run for the given merchant admin.')]
class QueueDemoRunCommand extends Command
{
    public function handle(QueueReviewAnalysisRunAction $queueReviewAnalysisRun): int
    {
        $user = User::query()->where('email', $this->argument('email'))->first();

        if (! $user instanceof User) {
            $this->error('Could not find a user for the provided email address.');

            return self::FAILURE;
        }

        $run = $queueReviewAnalysisRun->handle(
            $user,
            $this->option('prompt') ?: null,
            $this->option('message') ?: null,
        );

        $this->info('Queued Signals run.');
        $this->line('Run ID: '.$run->id);
        $this->line('Status: '.$run->status);
        $this->line('Prompt: '.$run->prompt);

        return self::SUCCESS;
    }
}
