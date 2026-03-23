<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Proposal;
use App\Models\ReviewAnalysisRun;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Proposal>
 */
class ProposalFactory extends Factory
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
            'type' => 'product_copy_change',
            'status' => 'pending',
            'target_type' => 'product',
            'target_id' => Product::factory(),
            'payload_json' => [
                'field' => 'fit_note',
                'before' => null,
                'after' => 'Customers say this item runs small. Consider sizing up for a roomier fit.',
                'supporting_review_ids' => [],
            ],
            'rationale' => fake()->sentence(14),
            'confidence' => fake()->randomFloat(3, 0.700, 0.980),
            'created_by' => 'agent',
            'approved_by' => null,
            'approved_at' => null,
            'applied_at' => null,
        ];
    }
}
