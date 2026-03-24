<?php

use App\Models\Product;
use App\Models\Proposal;
use App\Models\StorefrontPageOverride;

test('signals validate arrow override command passes for a valid proposal payload', function (): void {
    $product = Product::factory()->create();
    $proposal = Proposal::factory()->create([
        'type' => 'storefront_page_override',
        'target_type' => 'product',
        'target_id' => $product->id,
        'payload_json' => [
            'surface' => 'product_show',
            'title' => 'Valid override',
            'arrow_source' => [
                'main.ts' => 'import { html } from "@arrow-js/core"; import { product } from "./signals.ts"; export default html`<section>${product.name}</section>`;',
                'main.css' => '.page { color: #111827; }',
            ],
        ],
    ]);

    $this->artisan('signals:validate-arrow-override', ['id' => $proposal->id])
        ->expectsOutputToContain('Storefront page override proposal #'.$proposal->id)
        ->expectsOutputToContain('Arrow payload is valid.')
        ->assertSuccessful();
});

test('signals validate arrow override command fails for an invalid live override payload', function (): void {
    $product = Product::factory()->create();
    $override = StorefrontPageOverride::factory()->create([
        'product_id' => $product->id,
        'surface' => 'product_show',
        'title' => 'Broken override',
        'arrow_source_json' => [
            'main.ts' => 'export default html`<section>Broken</section>`;',
            'extra.ts' => 'export const nope = true;',
        ],
    ]);

    $this->artisan('signals:validate-arrow-override', ['id' => $override->id, '--live' => true])
        ->expectsOutputToContain('Live storefront override #'.$override->id)
        ->expectsOutputToContain('Arrow source may only contain main.ts or main.js plus optional main.css.')
        ->expectsOutputToContain('The entry file must import Arrow primitives from @arrow-js/core.')
        ->assertFailed();
});
