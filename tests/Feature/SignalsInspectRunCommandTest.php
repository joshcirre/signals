<?php

use App\Models\ActionLog;
use App\Models\Product;
use App\Models\Proposal;
use App\Models\ReviewAnalysisRun;

test('signals inspect run reports linked override and active session state', function (): void {
    $product = Product::factory()->create();
    $run = ReviewAnalysisRun::factory()->create([
        'kind' => 'storefront_adaptation',
        'status' => 'completed',
        'codex_thread_id' => 'thread_live_123',
        'codex_session_status' => 'active',
        'prompt' => 'Use create_storefront_page_override_proposal_tool and pass review_analysis_run_id=77.',
        'context_json' => [
            'product_id' => $product->id,
        ],
    ]);
    Proposal::factory()->create([
        'review_analysis_run_id' => $run->id,
        'type' => 'storefront_page_override',
        'target_type' => 'product',
        'target_id' => $product->id,
        'payload_json' => [
            'surface' => 'product_show',
            'title' => 'Premium Hoodie override',
            'arrow_source' => [
                'main.ts' => 'import { html } from "@arrow-js/core"; import { product } from "./signals.ts"; export default html`<section>${product.name}</section>`;',
            ],
        ],
    ]);
    ActionLog::factory()->create([
        'review_analysis_run_id' => $run->id,
        'action' => 'run.completed',
        'metadata_json' => [
            'message' => 'Local Codex run completed and streamed events back into Signals.',
        ],
    ]);

    $this->artisan('signals:inspect-run', ['run' => $run->id, '--strict' => true])
        ->expectsOutputToContain('Signals run #'.$run->id)
        ->expectsOutputToContain('Session status: active')
        ->expectsOutputToContain('Linked page override proposals: 1')
        ->expectsOutputToContain('Strict checks passed.')
        ->assertSuccessful();
});

test('signals inspect run strict mode fails when a storefront adaptation created only an unlinked override', function (): void {
    $product = Product::factory()->create();
    $run = ReviewAnalysisRun::factory()->create([
        'kind' => 'storefront_adaptation',
        'status' => 'completed',
        'codex_thread_id' => 'thread_live_123',
        'codex_session_status' => 'active',
        'prompt' => 'Storefront adaptation prompt without explicit linkage.',
        'context_json' => [
            'product_id' => $product->id,
        ],
    ]);
    Proposal::factory()->create([
        'review_analysis_run_id' => null,
        'type' => 'storefront_page_override',
        'target_type' => 'product',
        'target_id' => $product->id,
        'payload_json' => [
            'surface' => 'product_show',
            'title' => 'Unlinked override',
            'arrow_source' => [
                'main.ts' => 'import { html } from "@arrow-js/core"; import { product } from "./signals.ts"; export default html`<section>${product.name}</section>`;',
            ],
        ],
    ]);

    $this->artisan('signals:inspect-run', ['run' => $run->id, '--strict' => true])
        ->expectsOutputToContain('Recent unlinked page override proposals for this product:')
        ->expectsOutputToContain('Run prompt does not mention review_analysis_run_id.')
        ->expectsOutputToContain('Run has no linked storefront_page_override proposal.')
        ->assertFailed();
});

test('signals inspect run strict mode fails when the linked Arrow payload is invalid', function (): void {
    $product = Product::factory()->create();
    $run = ReviewAnalysisRun::factory()->create([
        'kind' => 'storefront_adaptation',
        'status' => 'completed',
        'codex_thread_id' => 'thread_live_123',
        'codex_session_status' => 'active',
        'prompt' => 'Use create_storefront_page_override_proposal_tool and pass review_analysis_run_id=77.',
        'context_json' => [
            'product_id' => $product->id,
        ],
    ]);
    Proposal::factory()->create([
        'review_analysis_run_id' => $run->id,
        'type' => 'storefront_page_override',
        'target_type' => 'product',
        'target_id' => $product->id,
        'payload_json' => [
            'surface' => 'product_show',
            'title' => 'Broken override',
            'arrow_source' => [
                'main.ts' => 'export default html`<section>Broken</section>`;',
            ],
        ],
    ]);

    $this->artisan('signals:inspect-run', ['run' => $run->id, '--strict' => true])
        ->expectsOutputToContain('validation: The entry file must import Arrow primitives from @arrow-js/core.')
        ->expectsOutputToContain('Run has an invalid storefront_page_override payload.')
        ->assertFailed();
});
