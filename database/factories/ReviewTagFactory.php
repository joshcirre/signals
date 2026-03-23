<?php

namespace Database\Factories;

use App\Models\ReviewTag;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReviewTag>
 */
class ReviewTagFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'normalized_name' => fake()->randomElement([
                'Sizing Issue',
                'Softness Praise',
                'Shipping Delay',
                'Packaging Problem',
                'Quality Praise',
            ]),
            'visibility' => 'internal',
        ];
    }
}
