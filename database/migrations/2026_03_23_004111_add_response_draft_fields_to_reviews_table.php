<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table): void {
            $table->text('response_draft')->nullable()->after('processed_at');
            $table->string('response_draft_status')->nullable()->after('response_draft');
            $table->timestamp('response_draft_approved_at')->nullable()->after('response_draft_status');
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table): void {
            $table->dropColumn([
                'response_draft',
                'response_draft_status',
                'response_draft_approved_at',
            ]);
        });
    }
};
