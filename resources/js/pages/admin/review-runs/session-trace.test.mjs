import assert from 'node:assert/strict';
import test from 'node:test';
import { buildToolTickerItems, prettifyToolContent } from './session-trace.ts';

test('buildToolTickerItems prioritizes recent tool updates and humanizes labels', () => {
    const items = buildToolTickerItems([
        {
            id: 'tool-1',
            name: 'mcp__signals__search_reviews',
            callContent: 'Calling signals.search_reviews',
            resultContent: 'Found 4 hoodie reviews',
            startedAt: '2026-03-23T20:00:00.000Z',
            completedAt: '2026-03-23T20:00:02.000Z',
            status: 'complete',
        },
        {
            id: 'tool-2',
            name: 'mcp__signals__create_product_copy_change_proposal_tool',
            callContent: 'Creating proposal',
            resultContent: null,
            startedAt: '2026-03-23T20:00:03.000Z',
            completedAt: null,
            status: 'running',
        },
    ]);

    assert.equal(items[0]?.id, 'tool-2');
    assert.equal(items[0]?.title, 'create product copy change proposal');
    assert.equal(items[0]?.detail, 'Creating proposal');
    assert.equal(items[1]?.title, 'search reviews');
});

test('prettifyToolContent unwraps structured json tool output', () => {
    assert.equal(
        prettifyToolContent('[{"text":"{\\"proposal_id\\":42}"}]'),
        JSON.stringify({ proposal_id: 42 }, null, 2),
    );
});
