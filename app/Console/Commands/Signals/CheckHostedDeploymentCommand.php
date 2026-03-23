<?php

namespace App\Console\Commands\Signals;

use App\Models\Product;
use App\Models\Proposal;
use App\Models\Review;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Arr;

#[Signature('signals:check-hosted-deployment {--strict : Fail when warnings are present}')]
#[Description('Validate that a hosted Signals deployment is configured for the live demo flow.')]
class CheckHostedDeploymentCommand extends Command
{
    public function handle(): int
    {
        $issues = [];
        $warnings = [];

        $appUrl = (string) config('app.url');
        $broadcastConnection = (string) config('broadcasting.default');
        $reverbConfig = config('broadcasting.connections.reverb');
        $reverbHost = (string) Arr::get($reverbConfig, 'options.host');
        $reverbScheme = (string) Arr::get($reverbConfig, 'options.scheme');
        $reverbPort = (int) Arr::get($reverbConfig, 'options.port');

        if ($appUrl === '' || ! filter_var($appUrl, FILTER_VALIDATE_URL)) {
            $issues[] = 'APP_URL must be a valid absolute URL.';
        }

        $appHost = parse_url($appUrl, PHP_URL_HOST);

        if ($appHost === null || $appHost === false) {
            $issues[] = 'APP_URL must include a valid host.';
        } elseif (in_array($appHost, ['localhost', '127.0.0.1', 'signals.test'], true)) {
            $warnings[] = 'APP_URL still points at a local domain. Set the hosted production URL before the demo.';
        }

        if (parse_url($appUrl, PHP_URL_SCHEME) !== 'https') {
            $warnings[] = 'APP_URL is not using https. Hosted demos should use TLS.';
        }

        if ($broadcastConnection !== 'reverb') {
            $issues[] = 'BROADCAST_CONNECTION must resolve to reverb.';
        }

        foreach ([
            'key' => Arr::get($reverbConfig, 'key'),
            'secret' => Arr::get($reverbConfig, 'secret'),
            'app_id' => Arr::get($reverbConfig, 'app_id'),
        ] as $name => $value) {
            if (! is_string($value) || mb_trim($value) === '') {
                $issues[] = sprintf('Reverb %s is missing.', $name);
            }
        }

        if ($reverbHost === '') {
            $issues[] = 'REVERB_HOST is missing.';
        } elseif (in_array($reverbHost, ['localhost', '127.0.0.1', 'signals.test'], true)) {
            $warnings[] = 'REVERB_HOST still points at a local domain.';
        }

        if (! in_array($reverbScheme, ['http', 'https'], true)) {
            $issues[] = 'REVERB_SCHEME must be http or https.';
        }

        if ($reverbPort < 1) {
            $issues[] = 'REVERB_PORT must be a valid port.';
        }

        if (User::query()->where('email', 'admin@example.com')->doesntExist()) {
            $issues[] = 'The demo admin account is missing. Run php artisan signals:seed-demo --force.';
        }

        if (Product::query()->count() < 4 || Review::query()->count() < 20 || Proposal::query()->count() < 2) {
            $issues[] = 'The demo catalog is incomplete. Run php artisan signals:seed-demo --force.';
        }

        $this->components->info('Signals hosted deployment check');
        $this->newLine();
        $this->line('App URL: '.$appUrl);
        $this->line('Signals MCP: '.route('signals.mcp'));
        $this->line('Device claim API: '.route('api.device.runs.claim'));
        $this->line(sprintf('Broadcasting: %s via %s://%s:%d', $broadcastConnection, $reverbScheme, $reverbHost, $reverbPort));

        $this->newLine();

        if ($issues === [] && $warnings === []) {
            $this->components->info('Hosted Signals deployment looks ready.');

            return self::SUCCESS;
        }

        foreach ($issues as $issue) {
            $this->components->error($issue);
        }

        foreach ($warnings as $warning) {
            $this->components->warn($warning);
        }

        if ($issues !== [] || ($warnings !== [] && $this->option('strict'))) {
            $this->newLine();
            $this->line('Recommended next step: php artisan signals:seed-demo --force');

            if ($warnings !== []) {
                $this->line('Then verify APP_URL and Reverb host values in the hosted environment.');
            }

            return self::FAILURE;
        }

        $this->newLine();
        $this->line('Warnings do not block the local demo, but they should be fixed before a hosted run.');

        return self::SUCCESS;
    }
}
