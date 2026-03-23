<?php

use App\Models\Product;
use App\Models\Proposal;
use App\Models\Review;
use App\Models\User;
use Database\Seeders\SignalsDemoSeeder;
use Inertia\Testing\AssertableInertia as Assert;

test('signals page uses the server app url for helper instructions', function (): void {
    $admin = User::factory()->create();

    $this->actingAs($admin)
        ->get('https://signals.example.com/admin/signals')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('admin/signals')
            ->where('appUrl', 'https://signals.example.com'));
});

test('signals app shell exposes the csrf token for echo auth', function (): void {
    $admin = User::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.signals'))
        ->assertSuccessful()
        ->assertSee('meta name="csrf-token"', false);
});

test('hosted deployment check passes for a seeded hosted demo environment', function (): void {
    config()->set('app.url', 'https://signals.example.com');
    config()->set('broadcasting.default', 'reverb');
    config()->set('broadcasting.connections.reverb.key', 'signals-key');
    config()->set('broadcasting.connections.reverb.secret', 'signals-secret');
    config()->set('broadcasting.connections.reverb.app_id', 'signals-app');
    config()->set('broadcasting.connections.reverb.options.host', 'signals.example.com');
    config()->set('broadcasting.connections.reverb.options.port', 443);
    config()->set('broadcasting.connections.reverb.options.scheme', 'https');

    resolve(SignalsDemoSeeder::class)->run();

    $this->artisan('signals:check-hosted-deployment')
        ->expectsOutputToContain('Signals hosted deployment check')
        ->expectsOutputToContain('Hosted Signals deployment looks ready.')
        ->assertSuccessful();
});

test('hosted deployment check fails when hosted config is still local', function (): void {
    config()->set('app.url', 'https://signals.test');
    config()->set('broadcasting.default', 'log');
    config()->set('broadcasting.connections.reverb.key', '');
    config()->set('broadcasting.connections.reverb.secret', '');
    config()->set('broadcasting.connections.reverb.app_id', '');
    config()->set('broadcasting.connections.reverb.options.host', 'signals.test');
    config()->set('broadcasting.connections.reverb.options.port', 443);
    config()->set('broadcasting.connections.reverb.options.scheme', 'https');

    User::query()->delete();
    Product::query()->delete();
    Review::query()->delete();
    Proposal::query()->delete();

    $this->artisan('signals:check-hosted-deployment --strict')
        ->expectsOutputToContain('APP_URL still points at a local domain')
        ->expectsOutputToContain('BROADCAST_CONNECTION must resolve to reverb.')
        ->expectsOutputToContain('The demo admin account is missing.')
        ->assertFailed();
});
