import assert from 'node:assert/strict';
import test from 'node:test';
import { buildToolTickerItem, prettifyToolContent } from './session-trace.ts';

test('buildToolTickerItem returns the current running tool when one exists', () => {
    const item = buildToolTickerItem([
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

    assert.equal(item?.id, 'tool-2');
    assert.equal(item?.title, 'create product copy change proposal');
    assert.equal(item?.detail, 'Creating proposal');
});

test('buildToolTickerItem falls back to the latest completed tool without rotating history', () => {
    const item = buildToolTickerItem([
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
            name: 'mcp__signals__create_storefront_widget_proposal_tool',
            callContent: 'Creating widget proposal',
            resultContent: 'Proposal updated',
            startedAt: '2026-03-23T20:00:03.000Z',
            completedAt: '2026-03-23T20:00:04.000Z',
            status: 'complete',
        },
    ]);

    assert.equal(item?.id, 'tool-2');
    assert.equal(item?.title, 'create storefront widget proposal');
    assert.equal(item?.detail, 'Proposal updated');
});

test('prettifyToolContent unwraps structured json tool output', () => {
    assert.equal(
        prettifyToolContent('[{"text":"{\\"proposal_id\\":42}"}]'),
        JSON.stringify({ proposal_id: 42 }, null, 2),
    );
});
