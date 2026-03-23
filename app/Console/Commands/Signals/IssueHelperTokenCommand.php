<?php

namespace App\Console\Commands\Signals;

use App\Actions\Signals\IssueHelperTokenAction;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('signals:issue-helper-token
    {email=admin@example.com : Merchant admin email address}
    {--device=Signals Helper : Human-readable helper device name}')]
#[Description('Issue a Signals helper device token for a merchant admin.')]
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

        $this->info('Issued Signals helper token.');
        $this->line('User: '.$user->email);
        $this->line('Device: '.$result['device']->name);
        $this->newLine();
        $this->line('Environment block:');
        $this->line('SIGNALS_SERVER_URL='.$baseUrl);
        $this->line('SIGNALS_DEVICE_TOKEN='.$result['token']);

        return self::SUCCESS;
    }
}
