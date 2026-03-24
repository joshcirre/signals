<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('storefront_page_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('surface')->default('product_show');
            $table->string('title')->nullable();
            $table->json('arrow_source_json');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_from_proposal_id')->nullable()->constrained('proposals')->nullOnDelete();
            $table->foreignId('created_from_run_id')->nullable()->constrained('review_analysis_runs')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->unique(['product_id', 'surface']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('storefront_page_overrides');
    }
};
