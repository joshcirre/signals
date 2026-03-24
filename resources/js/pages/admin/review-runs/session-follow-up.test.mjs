import assert from 'node:assert/strict';
import test from 'node:test';
import {
    canContinueSession,
    hasPreviewableProposal,
} from './session-follow-up.ts';

test('canContinueSession requires an active codex thread on a non-running run', () => {
    assert.equal(
        canContinueSession({
            codexSessionStatus: 'active',
            codexThreadId: 'thread_123',
            runStatus: 'completed',
        }),
        true,
    );

    assert.equal(
        canContinueSession({
            codexSessionStatus: 'active',
            codexThreadId: null,
            runStatus: 'completed',
        }),
        false,
    );

    assert.equal(
        canContinueSession({
            codexSessionStatus: 'active',
            codexThreadId: 'thread_123',
            runStatus: 'running',
        }),
        false,
    );
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
