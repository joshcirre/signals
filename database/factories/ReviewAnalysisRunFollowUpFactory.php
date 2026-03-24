<?php

namespace Database\Factories;

use App\Models\ReviewAnalysisRun;
use App\Models\ReviewAnalysisRunFollowUp;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReviewAnalysisRunFollowUp>
 */
class ReviewAnalysisRunFollowUpFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'review_analysis_run_id' => ReviewAnalysisRun::factory(),
            'requested_by' => User::factory(),
            'content' => fake()->sentence(),
            'status' => 'queued',
            'summary' => null,
            'error_message' => null,
            'requested_at' => now(),
            'started_at' => null,
            'completed_at' => null,
        ];
    }
}
