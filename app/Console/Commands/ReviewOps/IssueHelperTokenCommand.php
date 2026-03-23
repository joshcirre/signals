<?php

namespace App\Console\Commands\ReviewOps;

use App\Actions\ReviewOps\IssueHelperTokenAction;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('reviewops:issue-helper-token
    {email=admin@example.com : Merchant admin email address}
    {--device=ReviewOps Helper : Human-readable helper device name}')]
#[Description('Issue a ReviewOps helper device token for a merchant admin.')]
class IssueHelperTokenCommand extends Command
{
    public function handle(IssueHelperTokenAction $issueHelperToken): int
    {
        $user = User::query()->where('email', $this->argument('email'))->first();

        if (! $user instanceof User) {
            $this->error('Could not find a user for the provided email address.');

            return self::FAILURE;
        }

        $result = $issueHelperToken->handle(
            $user,
            (string) $this->option('device'),
        );

        $baseUrl = rtrim((string) config('app.url'), '/');

        $this->info('Issued ReviewOps helper token.');
        $this->line('User: '.$user->email);
        $this->line('Device: '.$result['device']->name);
        $this->newLine();
        $this->line('Environment block:');
        $this->line('REVIEWOPS_SERVER_URL='.$baseUrl);
        $this->line('REVIEWOPS_DEVICE_TOKEN='.$result['token']);

        return self::SUCCESS;
    }
}
