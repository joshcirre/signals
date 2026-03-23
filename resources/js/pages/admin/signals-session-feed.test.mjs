import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveSessionFeedState, eventBody } from './signals-session-feed.ts';

const milestoneActions = new Set([
    'run.queued',
    'run.claimed',
    'helper.started',
    'helper.codex.starting',
    'mcp.server.ready',
    'codex.thread.started',
    'codex.thread.ready',
    'codex.turn.started',
    'run.completed',
    'run.failed',
]);

test('deriveSessionFeedState keeps only the latest assistant update live', () => {
    const state = deriveSessionFeedState(
        [
            {
                id: 1,
                review_analysis_run_id: 10,
                actor_type: 'agent',
                action: 'run.queued',
                kind: 'status',
                content: 'Queued',
                tool_id: null,
                tool_name: null,
                item_id: null,
                is_error: false,
                metadata: {},
                created_at: '2026-03-23T20:00:00.000Z',
            },
            {
                id: 2,
                review_analysis_run_id: 10,
                actor_type: 'agent',
                action: 'codex.message',
                kind: 'assistant_text',
                content: 'Checking the available MCP servers.',
                tool_id: null,
                tool_name: null,
                item_id: 'assistant-1',
                is_error: false,
                metadata: {},
                created_at: '2026-03-23T20:00:01.000Z',
            },
            {
                id: 3,
                review_analysis_run_id: 10,
                actor_type: 'agent',
                action: 'codex.message',
                kind: 'assistant_text',
                content:
                    'I found the live review endpoint and am pulling data now.',
                tool_id: null,
                tool_name: null,
                item_id: 'assistant-2',
                is_error: false,
                metadata: {},
                created_at: '2026-03-23T20:00:02.000Z',
            },
        ],
        milestoneActions,
    );

    assert.equal(
        state.liveAssistantEvent?.content,
        'I found the live review endpoint and am pulling data now.',
    );
    assert.deepEqual(
        state.activityItems.map((item) =>
            item.type === 'timeline' ? item.event.action : item.tool.name,
        ),
        ['run.queued'],
    );
});

test('deriveSessionFeedState merges assistant deltas by item id before promoting the live update', () => {
    const state = deriveSessionFeedState(
        [
            {
                id: 11,
                review_analysis_run_id: 10,
                actor_type: 'agent',
                action: 'codex.message.delta',
                kind: 'assistant_text_delta',
                content: 'Checking ',
                tool_id: null,
                tool_name: null,
                item_id: 'assistant-1',
                is_error: false,
                metadata: {},
                created_at: '2026-03-23T20:00:01.000Z',
            },
            {
                id: 12,
                review_analysis_run_id: 10,
                actor_type: 'agent',
                action: 'codex.message.delta',
                kind: 'assistant_text_delta',
                content: 'reviews',
                tool_id: null,
                tool_name: null,
                item_id: 'assistant-1',
                is_error: false,
                metadata: {},
                created_at: '2026-03-23T20:00:01.100Z',
            },
            {
                id: 13,
                review_analysis_run_id: 10,
                actor_type: 'agent',
                action: 'codex.message',
                kind: 'assistant_text',
                content: 'Checking reviews',
                tool_id: null,
                tool_name: null,
                item_id: 'assistant-1',
                is_error: false,
                metadata: {},
                created_at: '2026-03-23T20:00:01.200Z',
            },
        ],
        milestoneActions,
    );

    assert.equal(state.liveAssistantEvent?.kind, 'assistant_text');
    assert.equal(state.liveAssistantEvent?.content, 'Checking reviews');
});

test('deriveSessionFeedState keeps tool activity in the session feed', () => {
    const state = deriveSessionFeedState(
        [
            {
                id: 21,
                review_analysis_run_id: 10,
                actor_type: 'agent',
                action: 'mcp.tool.started',
                kind: 'tool_call',
                content: 'Calling signals.search_reviews',
                tool_id: 'tool-1',
                tool_name: 'mcp__signals__search_reviews',
                item_id: null,
                is_error: false,
                metadata: {},
                created_at: '2026-03-23T20:00:03.000Z',
            },
            {
                id: 22,
                review_analysis_run_id: 10,
                actor_type: 'agent',
                action: 'mcp.tool.completed',
                kind: 'tool_result',
                content: 'Completed search',
                tool_id: 'tool-1',
                tool_name: 'mcp__signals__search_reviews',
                item_id: null,
                is_error: false,
                metadata: {},
                created_at: '2026-03-23T20:00:04.000Z',
            },
        ],
        milestoneActions,
    );

    assert.equal(state.liveAssistantEvent, null);
    assert.equal(state.activityItems.length, 1);
    assert.equal(state.activityItems[0]?.type, 'tool');
    assert.equal(state.activityItems[0]?.tool.status, 'complete');
});

test('eventBody falls back to metadata message', () => {
    assert.equal(
        eventBody({
            id: 31,
            review_analysis_run_id: 10,
            actor_type: 'agent',
            action: 'run.failed',
            kind: 'status',
            content: null,
            tool_id: null,
            tool_name: null,
            item_id: null,
            is_error: true,
            metadata: {
                message: 'The run failed while opening the MCP server.',
            },
            created_at: '2026-03-23T20:00:05.000Z',
        }),
        'The run failed while opening the MCP server.',
    );
});
