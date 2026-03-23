<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->randomElement([
            'Premium Hoodie',
            'Cloudweight Tee',
            'Studio Joggers',
            'Trail Blend Crewneck',
        ]);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'category' => 'Apparel',
            'price_cents' => fake()->numberBetween(3400, 9800),
            'hero_image_url' => 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
            'short_description' => fake()->sentence(8),
            'description' => fake()->paragraph(3),
            'fit_note' => null,
            'faq_items' => null,
            'status' => 'active',
        ];
    }
}
