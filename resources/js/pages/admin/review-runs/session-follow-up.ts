import type { ArrowSource } from '@/components/arrow-sandbox-widget';

export function canContinueSession({
    codexSessionStatus,
    codexThreadId,
    runStatus,
}: {
    codexSessionStatus: string | null;
    codexThreadId: string | null;
    runStatus: string;
}): boolean {
    return (
        codexThreadId !== null &&
        codexSessionStatus === 'active' &&
        runStatus !== 'running'
    );
}

export function hasPreviewableProposal(
    proposal: { payload: { arrow_source?: ArrowSource } } | null,
): boolean {
    return Boolean(proposal?.payload.arrow_source?.['main.ts']);
}
