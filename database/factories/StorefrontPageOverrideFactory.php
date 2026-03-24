<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ReviewAnalysisRun;
use App\Models\StorefrontPageOverride;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StorefrontPageOverride>
 */
class StorefrontPageOverrideFactory extends Factory
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
            'surface' => 'product_show',
            'title' => 'Live product page override',
            'arrow_source_json' => [
                'main.ts' => 'export default html`<section><h1>Live override</h1></section>`',
            ],
            'approved_by' => User::factory(),
            'created_from_proposal_id' => null,
            'created_from_run_id' => ReviewAnalysisRun::factory(),
            'approved_at' => now(),
        ];
    }
}
