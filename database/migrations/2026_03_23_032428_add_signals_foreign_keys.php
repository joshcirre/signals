<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }

        $this->addForeignKeyIfMissing('review_ops_devices', 'review_ops_devices_user_id_foreign', function (Blueprint $table): void {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        $this->addForeignKeyIfMissing('reviews', 'reviews_product_id_foreign', function (Blueprint $table): void {
            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
        });

        $this->addForeignKeyIfMissing('review_clusters', 'review_clusters_product_id_foreign', function (Blueprint $table): void {
            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
        });

        $this->addForeignKeyIfMissing('review_analysis_runs', 'review_analysis_runs_user_id_foreign', function (Blueprint $table): void {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        $this->addForeignKeyIfMissing('review_analysis_runs', 'review_analysis_runs_review_ops_device_id_foreign', function (Blueprint $table): void {
            $table->foreign('review_ops_device_id')->references('id')->on('review_ops_devices')->nullOnDelete();
        });

        $this->addForeignKeyIfMissing('action_logs', 'action_logs_review_analysis_run_id_foreign', function (Blueprint $table): void {
            $table->foreign('review_analysis_run_id')->references('id')->on('review_analysis_runs')->nullOnDelete();
        });

        $this->addForeignKeyIfMissing('proposals', 'proposals_review_analysis_run_id_foreign', function (Blueprint $table): void {
            $table->foreign('review_analysis_run_id')->references('id')->on('review_analysis_runs')->nullOnDelete();
        });

        $this->addForeignKeyIfMissing('proposals', 'proposals_approved_by_foreign', function (Blueprint $table): void {
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();
        });

        $this->addForeignKeyIfMissing('review_tag_assignments', 'review_tag_assignments_review_id_foreign', function (Blueprint $table): void {
            $table->foreign('review_id')->references('id')->on('reviews')->cascadeOnDelete();
        });

        $this->addForeignKeyIfMissing('review_tag_assignments', 'review_tag_assignments_review_tag_id_foreign', function (Blueprint $table): void {
            $table->foreign('review_tag_id')->references('id')->on('review_tags')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        if (! in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }

        $this->dropForeignKeyIfExists('review_tag_assignments', 'review_tag_assignments_review_tag_id_foreign');
        $this->dropForeignKeyIfExists('review_tag_assignments', 'review_tag_assignments_review_id_foreign');
        $this->dropForeignKeyIfExists('proposals', 'proposals_approved_by_foreign');
        $this->dropForeignKeyIfExists('proposals', 'proposals_review_analysis_run_id_foreign');
        $this->dropForeignKeyIfExists('action_logs', 'action_logs_review_analysis_run_id_foreign');
        $this->dropForeignKeyIfExists('review_analysis_runs', 'review_analysis_runs_review_ops_device_id_foreign');
        $this->dropForeignKeyIfExists('review_analysis_runs', 'review_analysis_runs_user_id_foreign');
        $this->dropForeignKeyIfExists('review_clusters', 'review_clusters_product_id_foreign');
        $this->dropForeignKeyIfExists('reviews', 'reviews_product_id_foreign');
        $this->dropForeignKeyIfExists('review_ops_devices', 'review_ops_devices_user_id_foreign');
    }

    private function addForeignKeyIfMissing(string $table, string $constraint, Closure $callback): void
    {
        if ($this->foreignKeyExists($table, $constraint)) {
            return;
        }

        Schema::table($table, $callback);
    }

    private function dropForeignKeyIfExists(string $table, string $constraint): void
    {
        if (! $this->foreignKeyExists($table, $constraint)) {
            return;
        }

        Schema::table($table, function (Blueprint $table) use ($constraint): void {
            $table->dropForeign($constraint);
        });
    }

    private function foreignKeyExists(string $table, string $constraint): bool
    {
        return DB::table('information_schema.table_constraints')
            ->where('constraint_schema', DB::raw('DATABASE()'))
            ->where('table_name', $table)
            ->where('constraint_name', $constraint)
            ->where('constraint_type', 'FOREIGN KEY')
            ->exists();
    }
};
