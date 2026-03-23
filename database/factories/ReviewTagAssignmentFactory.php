<?php

namespace Database\Factories;

use App\Models\Review;
use App\Models\ReviewTag;
use App\Models\ReviewTagAssignment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReviewTagAssignment>
 */
class ReviewTagAssignmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'review_id' => Review::factory(),
            'review_tag_id' => ReviewTag::factory(),
            'confidence' => fake()->randomFloat(3, 0.600, 0.990),
            'assigned_by' => 'agent',
        ];
    }
}
