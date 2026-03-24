<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('review_analysis_runs', function (Blueprint $table): void {
            $table->string('codex_thread_id')->nullable()->after('error_message');
            $table->string('codex_session_status')->nullable()->after('codex_thread_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('review_analysis_runs', function (Blueprint $table): void {
            $table->dropColumn(['codex_thread_id', 'codex_session_status']);
        });
    }
};
