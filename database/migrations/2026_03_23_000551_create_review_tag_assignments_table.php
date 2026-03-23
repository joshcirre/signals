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
        Schema::create('review_tag_assignments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('review_id')->constrained()->cascadeOnDelete();
            $table->foreignId('review_tag_id')->constrained()->cascadeOnDelete();
            $table->decimal('confidence', 4, 3)->default(0.500);
            $table->string('assigned_by')->default('agent');
            $table->timestamps();

            $table->unique(['review_id', 'review_tag_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('review_tag_assignments');
    }
};
