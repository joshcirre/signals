<?php

use App\Models\Product;
use App\Models\Proposal;
use App\Models\User;

test('admin can view the proposal queue page', function (): void {
    $admin = User::factory()->create();
    $product = Product::factory()->create([
        'name' => 'Premium Hoodie',
    ]);

    Proposal::factory()->create([
        'target_id' => $product->id,
        'rationale' => 'Repeated reviews say the hoodie runs small.',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.proposals.index'))
        ->assertSuccessful()
        ->assertSee('Premium Hoodie')
        ->assertSee('Repeated reviews say the hoodie runs small.');
});
