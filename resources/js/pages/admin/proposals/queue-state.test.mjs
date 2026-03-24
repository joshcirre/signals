import assert from 'node:assert/strict';
import test from 'node:test';
import { reconcileQueueState } from './queue-state.ts';

test('reconcileQueueState keeps the current selection when it still exists', () => {
    const proposals = [{ id: 11 }, { id: 22 }];

    assert.deepEqual(reconcileQueueState(proposals, 22, 22), {
        selectedProposalId: 22,
        editingProposalId: 22,
    });
});

test('reconcileQueueState falls back to the first proposal when selection disappears', () => {
    const proposals = [{ id: 11 }, { id: 22 }];

    assert.deepEqual(reconcileQueueState(proposals, 44, 44), {
        selectedProposalId: 11,
        editingProposalId: null,
    });
});

test('reconcileQueueState clears queue state when there are no proposals', () => {
    assert.deepEqual(reconcileQueueState([], 22, 22), {
        selectedProposalId: null,
        editingProposalId: null,
    });
});
