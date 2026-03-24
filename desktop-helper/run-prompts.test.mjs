import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildRunPrompt,
    buildStorefrontAdaptationPrompt,
    buildUiRefinementPrompt,
} from './run-prompts.mjs';

test('storefront adaptation prompt includes the concrete live run id', () => {
    const prompt = buildStorefrontAdaptationPrompt({
        id: 47,
        prompt: 'Base adaptation prompt',
    });

    assert.match(prompt, /Current live review_analysis_run_id: 47/);
    assert.match(
        prompt,
        /pass review_analysis_run_id=47/,
    );
    assert.match(
        prompt,
        /find_storefront_page_override_proposal_tool/,
    );
    assert.match(
        prompt,
        /signals:\/\/storefront-page-override-runtime/,
    );
    assert.match(
        prompt,
        /exactly one entry file named main\.ts or main\.js/,
    );
    assert.match(
        prompt,
        /@arrow-js\/core/,
    );
    assert.match(
        prompt,
        /Do not use bash, rg, sed, or local file inspection/,
    );
});

test('ui refinement prompt includes the concrete live run id', () => {
    const prompt = buildUiRefinementPrompt({
        id: 48,
        prompt: 'Base refinement prompt',
    });

    assert.match(prompt, /Current live review_analysis_run_id: 48/);
    assert.match(
        prompt,
        /same Codex thread/,
    );
    assert.match(
        prompt,
        /exactly one entry file named main\.ts or main\.js/,
    );
});

test('buildRunPrompt routes adaptation and refinement runs through the live run-id prompt helpers', () => {
    assert.match(
        buildRunPrompt({
            id: 49,
            kind: 'storefront_adaptation',
            prompt: 'Adapt',
        }),
        /review_analysis_run_id=49/,
    );

    assert.match(
        buildRunPrompt({
            id: 50,
            kind: 'ui_refinement',
            prompt: 'Refine',
        }),
        /review_analysis_run_id=50/,
    );
});
