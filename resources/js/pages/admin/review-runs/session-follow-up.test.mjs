import assert from 'node:assert/strict';
import test from 'node:test';
import {
    canContinueSession,
    hasPreviewableProposal,
    supportsUiSessionFollowUp,
} from './session-follow-up.ts';

test('canContinueSession requires an active codex thread on a non-running run', () => {
    assert.equal(
        canContinueSession({
            codexSessionStatus: 'active',
            codexThreadId: 'thread_123',
            runKind: 'storefront_adaptation',
            runStatus: 'completed',
        }),
        true,
    );

    assert.equal(
        canContinueSession({
            codexSessionStatus: 'active',
            codexThreadId: null,
            runKind: 'storefront_adaptation',
            runStatus: 'completed',
        }),
        false,
    );

    assert.equal(
        canContinueSession({
            codexSessionStatus: 'active',
            codexThreadId: 'thread_123',
            runKind: 'storefront_adaptation',
            runStatus: 'running',
        }),
        false,
    );

    assert.equal(
        canContinueSession({
            codexSessionStatus: 'active',
            codexThreadId: 'thread_123',
            runKind: 'review_analysis',
            runStatus: 'completed',
        }),
        false,
    );
});

test('supportsUiSessionFollowUp only allows storefront UI runs', () => {
    assert.equal(supportsUiSessionFollowUp('storefront_adaptation'), true);
    assert.equal(supportsUiSessionFollowUp('ui_refinement'), true);
    assert.equal(supportsUiSessionFollowUp('review_analysis'), false);
});

test('hasPreviewableProposal only returns true when Arrow source includes main.ts', () => {
    assert.equal(hasPreviewableProposal(null), false);
    assert.equal(
        hasPreviewableProposal({
            payload: {
                arrow_source: {},
            },
        }),
        false,
    );
    assert.equal(
        hasPreviewableProposal({
            payload: {
                arrow_source: {
                    'main.ts': 'export default html`<div />`',
                },
            },
        }),
        true,
    );
});
