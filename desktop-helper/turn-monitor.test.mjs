import assert from 'node:assert/strict';
import test from 'node:test';
import {
    extractThreadId,
    extractTurnId,
    matchesActiveTurn,
} from './turn-monitor.mjs';

test('extractTurnId supports both nested and flat turn payloads', () => {
    assert.equal(extractTurnId({ turn: { id: 'turn_main' } }), 'turn_main');
    assert.equal(extractTurnId({ turnId: 'turn_flat' }), 'turn_flat');
    assert.equal(extractTurnId({ id: 'turn_root' }), 'turn_root');
    assert.equal(extractTurnId(null), null);
});

test('extractThreadId supports nested turn and thread payloads', () => {
    assert.equal(
        extractThreadId({ turn: { thread_id: 'thread_main' } }),
        'thread_main',
    );
    assert.equal(
        extractThreadId({ turn: { threadId: 'thread_camel' } }),
        'thread_camel',
    );
    assert.equal(extractThreadId({ thread: { id: 'thread_root' } }), 'thread_root');
    assert.equal(extractThreadId({ threadId: 'thread_flat' }), 'thread_flat');
    assert.equal(extractThreadId(undefined), null);
});

test('matchesActiveTurn ignores unrelated spawned-agent completions', () => {
    assert.equal(
        matchesActiveTurn(
            {
                method: 'turn/completed',
                params: {
                    turn: {
                        id: 'turn_worker',
                        thread_id: 'thread_worker',
                        status: 'completed',
                    },
                },
            },
            {
                turnId: 'turn_main',
                threadId: 'thread_main',
            },
        ),
        false,
    );

    assert.equal(
        matchesActiveTurn(
            {
                method: 'turn/completed',
                params: {
                    turn: {
                        id: 'turn_main',
                        thread_id: 'thread_main',
                        status: 'completed',
                    },
                },
            },
            {
                turnId: 'turn_main',
                threadId: 'thread_main',
            },
        ),
        true,
    );
});

test('matchesActiveTurn falls back to thread identity when turn id is absent', () => {
    assert.equal(
        matchesActiveTurn(
            {
                method: 'turn/completed',
                params: {
                    thread: {
                        id: 'thread_main',
                    },
                },
            },
            {
                turnId: null,
                threadId: 'thread_main',
            },
        ),
        true,
    );
});
