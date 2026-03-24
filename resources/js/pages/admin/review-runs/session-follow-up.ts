import type { ArrowSource } from '@/components/arrow-sandbox-widget';

export function supportsUiSessionFollowUp(runKind: string): boolean {
    return runKind === 'storefront_adaptation' || runKind === 'ui_refinement';
}

export function canContinueSession({
    codexSessionStatus,
    codexThreadId,
    runKind,
    runStatus,
}: {
    codexSessionStatus: string | null;
    codexThreadId: string | null;
    runKind: string;
    runStatus: string;
}): boolean {
    return (
        supportsUiSessionFollowUp(runKind) &&
        codexThreadId !== null &&
        codexSessionStatus === 'active' &&
        runStatus !== 'running'
    );
}

export function hasPreviewableProposal(
    proposal: { payload: { arrow_source?: ArrowSource } } | null,
): boolean {
    return Boolean(
        proposal?.payload.arrow_source?.['main.ts'] ??
        proposal?.payload.arrow_source?.['main.js'],
    );
}
