<?php

namespace Database\Factories;

use App\Models\ReviewAnalysisRun;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReviewAnalysisRun>
 */
class ReviewAnalysisRunFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'review_ops_device_id' => null,
            'status' => 'queued',
            'kind' => 'review_analysis',
            'prompt' => 'Analyze the latest apparel reviews and create merchant-facing proposals.',
            'context_json' => null,
            'summary' => null,
            'error_message' => null,
            'requested_at' => now(),
            'started_at' => null,
            'completed_at' => null,
        ];
    }
}
