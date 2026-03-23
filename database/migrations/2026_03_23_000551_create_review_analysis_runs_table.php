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
        Schema::create('review_analysis_runs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->index();
            $table->foreignId('review_ops_device_id')->nullable()->index();
            $table->string('status')->default('queued');
            $table->text('prompt')->nullable();
            $table->text('summary')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('review_analysis_runs');
    }
};
