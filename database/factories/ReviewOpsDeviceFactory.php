<?php

namespace Database\Factories;

use App\Models\ReviewOpsDevice;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<ReviewOpsDevice>
 */
class ReviewOpsDeviceFactory extends Factory
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
            'name' => fake()->word().' helper',
            'token_hash' => Hash::make(Str::random(40)),
            'is_active' => true,
            'last_seen_at' => null,
        ];
    }
}
