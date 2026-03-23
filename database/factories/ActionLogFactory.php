<?php

namespace Database\Factories;

use App\Models\ActionLog;
use App\Models\ReviewAnalysisRun;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ActionLog>
 */
class ActionLogFactory extends Factory
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
            'actor_type' => fake()->randomElement(['agent', 'human', 'system']),
            'actor_id' => null,
            'action' => fake()->randomElement(['run.queued', 'tool.call', 'proposal.created']),
            'target_type' => null,
            'target_id' => null,
            'metadata_json' => ['message' => fake()->sentence()],
        ];
    }
}
