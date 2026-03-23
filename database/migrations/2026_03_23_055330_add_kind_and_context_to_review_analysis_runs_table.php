<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('review_analysis_runs', function (Blueprint $table): void {
            $table->string('kind')->default('review_analysis')->after('status');
            $table->json('context_json')->nullable()->after('prompt');
        });
    }

    public function down(): void
    {
        Schema::table('review_analysis_runs', function (Blueprint $table): void {
            $table->dropColumn(['kind', 'context_json']);
        });
    }
};
