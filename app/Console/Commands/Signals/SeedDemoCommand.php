<?php

namespace App\Console\Commands\Signals;

use Closure;
use Database\Seeders\SignalsDemoSeeder;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Console\ConfirmableTrait;

#[Signature('signals:seed-demo {--force : Force the demo seed to run in production}')]
#[Description('Seed or reset the hosted Signals demo dataset in an idempotent way.')]
class SeedDemoCommand extends Command
{
    use ConfirmableTrait;

    public function handle(): int
    {
        if (! $this->confirmToProceed()) {
            return self::FAILURE;
        }

        $this->components->info('Seeding the Signals demo dataset...');

        resolve(SignalsDemoSeeder::class)->run();

        $this->newLine();
        $this->line('Admin login: admin@example.com / password');
        $this->line('Admin path: /admin/signals');
        $this->line('Public storefront: /');

        return self::SUCCESS;
    }

    protected function getDefaultConfirmCallback(): Closure
    {
        return fn (): bool => app()->environment('production');
    }
}
