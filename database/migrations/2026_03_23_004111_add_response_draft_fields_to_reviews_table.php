<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('reviews', 'processed_at')) {
            Schema::table('reviews', function (Blueprint $table): void {
                $table->timestamp('processed_at')->nullable();
            });
        }

        if (! Schema::hasColumn('reviews', 'response_draft')) {
            Schema::table('reviews', function (Blueprint $table): void {
                $table->text('response_draft')->nullable();
            });
        }

        if (! Schema::hasColumn('reviews', 'response_draft_status')) {
            Schema::table('reviews', function (Blueprint $table): void {
                $table->string('response_draft_status')->nullable();
            });
        }

        if (! Schema::hasColumn('reviews', 'response_draft_approved_at')) {
            Schema::table('reviews', function (Blueprint $table): void {
                $table->timestamp('response_draft_approved_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        $columns = collect([
            'response_draft',
            'response_draft_status',
            'response_draft_approved_at',
        ])->filter(fn (string $column): bool => Schema::hasColumn('reviews', $column))
            ->values()
            ->all();

        if ($columns !== []) {
            Schema::table('reviews', function (Blueprint $table) use ($columns): void {
                $table->dropColumn($columns);
            });
        }
    }
};
