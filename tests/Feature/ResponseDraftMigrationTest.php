<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

test('response draft migration repairs legacy review tables without processed_at', function (): void {
    Schema::dropIfExists('reviews');

    Schema::create('reviews', function (Blueprint $table): void {
        $table->id();
        $table->unsignedBigInteger('product_id')->nullable();
        $table->string('author_name');
        $table->unsignedTinyInteger('rating');
        $table->string('title')->nullable();
        $table->text('body');
        $table->string('source')->default('storefront');
        $table->timestamp('reviewed_at');
        $table->timestamps();
    });

    $migration = require database_path('migrations/2026_03_23_004111_add_response_draft_fields_to_reviews_table.php');
    $migration->up();

    expect(Schema::hasColumn('reviews', 'processed_at'))->toBeTrue()
        ->and(Schema::hasColumn('reviews', 'response_draft'))->toBeTrue()
        ->and(Schema::hasColumn('reviews', 'response_draft_status'))->toBeTrue()
        ->and(Schema::hasColumn('reviews', 'response_draft_approved_at'))->toBeTrue();
});
