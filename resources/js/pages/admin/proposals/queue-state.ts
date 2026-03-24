export interface QueueProposalState {
    id: number;
}

export interface ReconciledQueueState {
    editingProposalId: number | null;
    selectedProposalId: number | null;
}

export function reconcileQueueState(
    proposals: QueueProposalState[],
    selectedProposalId: number | null,
    editingProposalId: number | null,
): ReconciledQueueState {
    if (proposals.length === 0) {
        return {
            selectedProposalId: null,
            editingProposalId: null,
        };
    }

    const hasSelectedProposal = proposals.some(
        (proposal) => proposal.id === selectedProposalId,
    );
    const hasEditingProposal = proposals.some(
        (proposal) => proposal.id === editingProposalId,
    );

    return {
        selectedProposalId: hasSelectedProposal
            ? selectedProposalId
            : proposals[0].id,
        editingProposalId: hasEditingProposal ? editingProposalId : null,
    };
}
