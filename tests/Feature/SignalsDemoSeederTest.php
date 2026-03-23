<?php

use App\Models\ActionLog;
use App\Models\Product;
use App\Models\Proposal;
use App\Models\Review;
use App\Models\ReviewAnalysisRun;
use App\Models\User;
use Database\Seeders\SignalsDemoSeeder;

test('signals demo seeder is idempotent', function (): void {
    resolve(SignalsDemoSeeder::class)->run();
    resolve(SignalsDemoSeeder::class)->run();

    expect(User::query()->where('email', 'admin@example.com')->count())->toBe(1)
        ->and(Product::query()->whereIn('slug', [
            'premium-hoodie',
            'cloudweight-tee',
            'studio-joggers',
            'trail-blend-crewneck',
        ])->count())->toBe(4)
        ->and(Product::query()->where('slug', 'studio-joggers')->value('hero_image_url'))
        ->toBe('https://images.pexels.com/photos/32233645/pexels-photo-32233645.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=960')
        ->and(Product::query()->where('slug', 'trail-blend-crewneck')->value('hero_image_url'))
        ->toBe('https://images.pexels.com/photos/32233642/pexels-photo-32233642.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=960')
        ->and(Review::query()->count())->toBe(20)
        ->and(Proposal::query()->count())->toBe(2)
        ->and(ReviewAnalysisRun::query()->count())->toBe(1)
        ->and(ActionLog::query()->count())->toBe(4);
});

test('signals seed demo command can seed the hosted dataset', function (): void {
    $this->artisan('signals:seed-demo')
        ->expectsOutputToContain('Seeding the Signals demo dataset')
        ->expectsOutputToContain('admin@example.com / password')
        ->assertSuccessful();

    $this->assertDatabaseHas('users', [
        'email' => 'admin@example.com',
    ]);

    $this->assertDatabaseHas('products', [
        'slug' => 'premium-hoodie',
    ]);
});
