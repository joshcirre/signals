<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ReviewCluster;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReviewCluster>
 */
class ReviewClusterFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'title' => fake()->sentence(3),
            'summary' => fake()->paragraph(),
            'severity' => fake()->randomElement(['low', 'medium', 'high']),
            'review_count' => fake()->numberBetween(2, 8),
        ];
    }
}
