import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { PencilLine, Save, ShieldCheck, ShieldX, Wand2 } from 'lucide-react';
import { useState } from 'react';
import {
    AdminHeader,
    AdminPage,
    AdminPill,
    AdminSurface,
    AdminSurfaceBody,
    AdminSurfaceHeader,
} from '@/components/admin-page';
import { ArrowSandboxWidget } from '@/components/arrow-sandbox-widget';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
import productRoutes from '@/routes/products';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Start',
        href: dashboard(),
    },
    {
        title: 'Review',
        href: admin.proposals.index(),
    },
];

interface ArrowSource {
    'main.ts': string;
    'main.css'?: string;
}

interface Proposal {
    id: number;
    type: string;
    status: string;
    target_type: string;
    target_id: number;
    target_label: string;
    target_slug: string | null;
    rationale: string;
    confidence: number;
    created_at: string;
    payload: {
        field?: string | null;
        after?: string | null;
        response_draft?: string | null;
        position?: string;
        title?: string;
        arrow_source?: ArrowSource;
    };
}

interface PageProps {
    auth: { user: { id: number } };
    [key: string]: unknown;
}

interface ProposalQueueProps {
    filters: {
        status: string;
    };
    proposals: Proposal[];
}

interface ProposalUpdatedEvent {
    id: number;
    type: string;
    status: string;
    payload: Proposal['payload'];
}

function proposalFieldLabel(field: string | null | undefined): string {
    if (!field) {
        return 'Storefront copy';
    }

    return field.replaceAll('_', ' ');
}

export default function ProposalQueue({
    filters,
    proposals: initialProposals,
}: ProposalQueueProps) {
    const { auth } = usePage<PageProps>().props;
    const statusFilter = filters.status;
    const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
    const [selectedProposalId, setSelectedProposalId] = useState<number | null>(
        initialProposals[0]?.id ?? null,
    );
    const [editingProposalId, setEditingProposalId] = useState<number | null>(
        null,
    );
    const [refineQuery, setRefineQuery] = useState('');
    const form = useForm({
        content: '',
        rationale: '',
        confidence: 0.9,
    });
    const proposalCounts = proposals.reduce(
        (counts, proposal) => {
            counts.total += 1;
            counts[proposal.status as 'pending' | 'applied' | 'rejected'] += 1;

            return counts;
        },
        {
            total: 0,
            pending: 0,
            applied: 0,
            rejected: 0,
        },
    );
    const selectedProposal =
        proposals.find((proposal) => proposal.id === selectedProposalId) ??
        proposals[0] ??
        null;
    const selectedContent =
        selectedProposal === null
            ? ''
            : selectedProposal.type === 'review_response'
              ? (selectedProposal.payload.response_draft ?? '')
              : (selectedProposal.payload.after ?? '');
    const isEditingSelected =
        selectedProposal !== null && editingProposalId === selectedProposal.id;

    useEcho<ProposalUpdatedEvent>(
        `signals.user.${auth.user.id}`,
        '.proposal.updated',
        (payload) => {
            setProposals((current) =>
                current.map((p) =>
                    p.id === payload.id
                        ? {
                              ...p,
                              status: payload.status,
                              payload: payload.payload,
                          }
                        : p,
                ),
            );
        },
        [auth.user.id],
    );

    const beginEditingProposal = (proposalId: number) => {
        const proposal = proposals.find((item) => item.id === proposalId);

        if (!proposal) {
            return;
        }

        form.setData({
            content:
                proposal.type === 'review_response'
                    ? (proposal.payload.response_draft ?? '')
                    : (proposal.payload.after ?? ''),
            rationale: proposal.rationale,
            confidence: proposal.confidence,
        });
        setSelectedProposalId(proposal.id);
        setEditingProposalId(proposal.id);
    };

    const refineWithCodex = () => {
        if (!selectedProposal) {
            return;
        }

        router.post(admin.reviewRuns.store().url, {
            kind: 'ui_refinement',
            proposal_id: selectedProposal.id,
            focus: refineQuery,
            redirect_to: 'proposals',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Review" />

            <AdminPage>
                <AdminHeader
                    eyebrow="Review"
                    title="Review resolutions"
                    meta={
                        <>
                            <AdminPill>
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                {proposalCounts.pending} pending
                            </AdminPill>
                            <AdminPill>
                                <span className="size-1.5 rounded-full bg-slate-300" />
                                {proposalCounts.total} visible
                            </AdminPill>
                        </>
                    }
                    actions={
                        <div className="flex flex-wrap gap-1 rounded-sm border border-slate-950/8 bg-slate-50 p-1">
                            {['pending', 'applied', 'rejected', 'all'].map(
                                (status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() =>
                                            router.get(
                                                admin.proposals.index().url,
                                                { status },
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                },
                                            )
                                        }
                                        className={cn(
                                            'rounded-sm px-3 py-1.5 text-xs font-medium capitalize transition',
                                            statusFilter === status
                                                ? 'bg-white text-slate-950 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-950',
                                        )}
                                    >
                                        {status}
                                    </button>
                                ),
                            )}
                        </div>
                    }
                />

                <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                    <AdminSurface className="overflow-hidden xl:sticky xl:top-18 xl:h-fit">
                        <AdminSurfaceHeader
                            title="Queue"
                            action={
                                <span className="text-xs font-medium text-slate-400">
                                    {proposals.length} item
                                    {proposals.length === 1 ? '' : 's'}
                                </span>
                            }
                        />
                        <AdminSurfaceBody className="space-y-2">
                            {proposals.length > 0 ? (
                                proposals.map((proposal) => (
                                    <button
                                        key={proposal.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedProposalId(proposal.id);
                                            setEditingProposalId(null);
                                        }}
                                        className={cn(
                                            'w-full rounded-sm border px-3 py-3 text-left transition',
                                            proposal.id === selectedProposal?.id
                                                ? 'border-slate-950 bg-slate-950 text-white'
                                                : 'border-slate-950/8 bg-slate-50 text-slate-800 hover:border-slate-950/20 hover:bg-white',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p
                                                    className={cn(
                                                        'text-[10px] font-medium tracking-[0.18em] uppercase',
                                                        proposal.id ===
                                                            selectedProposal?.id
                                                            ? 'text-white/55'
                                                            : 'text-slate-400',
                                                    )}
                                                >
                                                    {proposal.type.replaceAll(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </p>
                                                <p className="mt-1 truncate text-sm font-medium">
                                                    {proposal.type ===
                                                    'storefront_widget'
                                                        ? (proposal.payload
                                                              .title ??
                                                          proposal.target_label)
                                                        : proposal.target_label}
                                                </p>
                                                <p
                                                    className={cn(
                                                        'mt-1 line-clamp-2 text-sm leading-5',
                                                        proposal.id ===
                                                            selectedProposal?.id
                                                            ? 'text-white/70'
                                                            : 'text-slate-500',
                                                    )}
                                                >
                                                    {proposal.rationale}
                                                </p>
                                            </div>
                                            <span
                                                className={cn(
                                                    'rounded-sm px-2 py-1 text-[10px] font-semibold',
                                                    proposal.id ===
                                                        selectedProposal?.id
                                                        ? 'bg-white/10 text-white'
                                                        : 'bg-white text-slate-500 ring-1 ring-slate-950/8',
                                                )}
                                            >
                                                {(
                                                    proposal.confidence * 100
                                                ).toFixed(0)}
                                                %
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                                            <span
                                                className={cn(
                                                    'capitalize',
                                                    proposal.id ===
                                                        selectedProposal?.id
                                                        ? 'text-white/60'
                                                        : 'text-slate-400',
                                                )}
                                            >
                                                {proposal.status}
                                            </span>
                                            <span
                                                className={cn(
                                                    proposal.id ===
                                                        selectedProposal?.id
                                                        ? 'text-white/45'
                                                        : 'text-slate-400',
                                                )}
                                            >
                                                {proposal.created_at}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="rounded-sm border border-dashed border-slate-950/8 px-3 py-6 text-sm leading-6 text-slate-500">
                                    No proposals match the current filter.
                                </div>
                            )}
                        </AdminSurfaceBody>
                    </AdminSurface>

                    <AdminSurface>
                        <AdminSurfaceHeader
                            title={
                                selectedProposal
                                    ? selectedProposal.type ===
                                      'storefront_widget'
                                        ? (selectedProposal.payload.title ??
                                          selectedProposal.target_label)
                                        : selectedProposal.target_label
                                    : 'Nothing selected'
                            }
                            description={
                                selectedProposal ? (
                                    <span className="capitalize">
                                        {selectedProposal.type.replaceAll(
                                            '_',
                                            ' ',
                                        )}{' '}
                                        · {selectedProposal.status}
                                    </span>
                                ) : (
                                    'Choose a proposal from the queue to inspect it.'
                                )
                            }
                            action={
                                selectedProposal ? (
                                    <AdminPill className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                        {(
                                            selectedProposal.confidence * 100
                                        ).toFixed(0)}
                                        % confidence
                                    </AdminPill>
                                ) : null
                            }
                        />
                        <AdminSurfaceBody className="space-y-4">
                            {selectedProposal ? (
                                selectedProposal.type ===
                                'storefront_widget' ? (
                                    <StorefrontWidgetDetail
                                        proposal={selectedProposal}
                                        refineQuery={refineQuery}
                                        onRefineQueryChange={setRefineQuery}
                                        onRefine={refineWithCodex}
                                    />
                                ) : isEditingSelected ? (
                                    <form
                                        className="space-y-4"
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            form.patch(
                                                admin.proposals.update({
                                                    proposal:
                                                        selectedProposal.id,
                                                }).url,
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        setEditingProposalId(
                                                            null,
                                                        );
                                                    },
                                                },
                                            );
                                        }}
                                    >
                                        <label className="block text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                            Proposed content
                                            <textarea
                                                value={form.data.content}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'content',
                                                        event.target.value,
                                                    )
                                                }
                                                className="mt-2 min-h-40 w-full rounded-sm border border-slate-950/10 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none focus:border-slate-950/20 focus:ring-2 focus:ring-slate-950/5"
                                            />
                                        </label>
                                        <label className="block text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                            Rationale
                                            <textarea
                                                value={form.data.rationale}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'rationale',
                                                        event.target.value,
                                                    )
                                                }
                                                className="mt-2 min-h-28 w-full rounded-sm border border-slate-950/10 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none focus:border-slate-950/20 focus:ring-2 focus:ring-slate-950/5"
                                            />
                                        </label>
                                        <label className="block text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                            Confidence
                                            <input
                                                type="number"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={form.data.confidence}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'confidence',
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                className="mt-2 w-full rounded-sm border border-slate-950/10 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-950/20 focus:ring-2 focus:ring-slate-950/5"
                                            />
                                        </label>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="submit"
                                                disabled={form.processing}
                                                className="inline-flex items-center gap-2 rounded-sm bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                                            >
                                                <Save className="size-4" />
                                                Save edits
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEditingProposalId(null)
                                                }
                                                className="rounded-sm border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-950/20 hover:bg-slate-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div className="grid gap-3 md:grid-cols-3">
                                            <div className="rounded-sm border border-slate-950/7 bg-slate-50 px-3.5 py-3">
                                                <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                    Created
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-slate-950">
                                                    {
                                                        selectedProposal.created_at
                                                    }
                                                </p>
                                            </div>
                                            <div className="rounded-sm border border-slate-950/7 bg-slate-50 px-3.5 py-3">
                                                <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                    Status
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-slate-950 capitalize">
                                                    {selectedProposal.status}
                                                </p>
                                            </div>
                                            <div className="rounded-sm border border-slate-950/7 bg-slate-50 px-3.5 py-3">
                                                <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                    Field
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-slate-950">
                                                    {proposalFieldLabel(
                                                        selectedProposal.payload
                                                            .field,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-sm border border-slate-950/7 bg-slate-50 px-4 py-4">
                                            <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                Rationale
                                            </p>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                {selectedProposal.rationale}
                                            </p>
                                        </div>

                                        <div className="rounded-sm border border-slate-950/7 bg-white px-4 py-4">
                                            <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                {selectedProposal.type ===
                                                'review_response'
                                                    ? 'Suggested response'
                                                    : 'Suggested change'}
                                            </p>
                                            <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-slate-700">
                                                {selectedContent ||
                                                    'No content attached.'}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            {selectedProposal.status ===
                                            'pending' ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            beginEditingProposal(
                                                                selectedProposal.id,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-sm border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                                                    >
                                                        <PencilLine className="size-4" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            router.post(
                                                                admin.proposals.approve(
                                                                    {
                                                                        proposal:
                                                                            selectedProposal.id,
                                                                    },
                                                                ).url,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-sm bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                                                    >
                                                        <ShieldCheck className="size-4" />
                                                        Approve and publish
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            router.post(
                                                                admin.proposals.reject(
                                                                    {
                                                                        proposal:
                                                                            selectedProposal.id,
                                                                    },
                                                                ).url,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-sm border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-950/20 hover:bg-slate-50"
                                                    >
                                                        <ShieldX className="size-4" />
                                                        Reject
                                                    </button>
                                                </>
                                            ) : null}
                                        </div>

                                        <div className="rounded-sm border border-slate-950/7 bg-slate-50 px-4 py-4">
                                            <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                Next step
                                            </p>
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                {selectedProposal.target_slug ? (
                                                    <Link
                                                        href={
                                                            productRoutes.show({
                                                                product:
                                                                    selectedProposal.target_slug,
                                                            }).url
                                                        }
                                                        className="rounded-sm border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-950/20 hover:bg-slate-50"
                                                    >
                                                        Preview storefront
                                                    </Link>
                                                ) : null}
                                                {selectedProposal.type ===
                                                    'product_copy_change' &&
                                                selectedProposal.target_slug ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            router.post(
                                                                admin.reviewRuns.store()
                                                                    .url,
                                                                {
                                                                    kind: 'storefront_adaptation',
                                                                    proposal_id:
                                                                        selectedProposal.id,
                                                                },
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-sm border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
                                                    >
                                                        <ShieldCheck className="size-4" />
                                                        Launch adaptation
                                                        session
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </>
                                )
                            ) : (
                                <div className="rounded-sm border border-dashed border-slate-950/8 px-4 py-10 text-sm leading-6 text-slate-500">
                                    No proposal is selected because the queue is
                                    empty for this filter.
                                </div>
                            )}
                        </AdminSurfaceBody>
                    </AdminSurface>
                </div>
            </AdminPage>
        </AppLayout>
    );
}

function StorefrontWidgetDetail({
    proposal,
    refineQuery,
    onRefineQueryChange,
    onRefine,
}: {
    proposal: Proposal;
    refineQuery: string;
    onRefineQueryChange: (v: string) => void;
    onRefine: () => void;
}) {
    const arrowSource = proposal.payload.arrow_source;

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-sm border border-slate-950/7 bg-slate-50 px-3.5 py-3">
                    <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                        Position
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-950 capitalize">
                        {(
                            proposal.payload.position ?? 'below_products'
                        ).replaceAll('_', ' ')}
                    </p>
                </div>
                <div className="rounded-sm border border-slate-950/7 bg-slate-50 px-3.5 py-3">
                    <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                        Status
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-950 capitalize">
                        {proposal.status}
                    </p>
                </div>
            </div>

            <div className="rounded-sm border border-slate-950/7 bg-slate-50 px-4 py-4">
                <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                    Rationale
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    {proposal.rationale}
                </p>
            </div>

            {arrowSource?.['main.ts'] ? (
                <div className="overflow-hidden rounded-sm border border-slate-950/7">
                    <div className="border-b border-slate-950/6 bg-slate-50 px-4 py-2.5">
                        <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                            Live preview
                        </p>
                    </div>
                    <div className="bg-white p-4">
                        <ArrowSandboxWidget source={arrowSource} />
                    </div>
                </div>
            ) : (
                <div className="rounded-sm border border-dashed border-slate-950/10 px-4 py-8 text-center text-sm text-slate-400">
                    No Arrow source attached yet.
                </div>
            )}

            {proposal.status === 'pending' ? (
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            router.post(
                                admin.proposals.approve({
                                    proposal: proposal.id,
                                }).url,
                            )
                        }
                        className="inline-flex items-center gap-2 rounded-sm bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                        <ShieldCheck className="size-4" />
                        Approve and publish
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            router.post(
                                admin.proposals.reject({
                                    proposal: proposal.id,
                                }).url,
                            )
                        }
                        className="inline-flex items-center gap-2 rounded-sm border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-950/20 hover:bg-slate-50"
                    >
                        <ShieldX className="size-4" />
                        Reject
                    </button>
                </div>
            ) : null}

            <div className="rounded-sm border border-slate-950/7 bg-slate-50 px-4 py-4">
                <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                    Refine with Codex
                </p>
                <p className="mt-2 text-sm text-slate-500">
                    Describe a change and Codex will update the widget live.
                </p>
                <div className="mt-3 flex gap-2">
                    <input
                        type="text"
                        value={refineQuery}
                        onChange={(e) => onRefineQueryChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onRefine();
                            }
                        }}
                        placeholder="Make the chart taller, add a legend…"
                        className="flex-1 rounded-sm border border-slate-950/10 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-950/20"
                    />
                    <button
                        type="button"
                        onClick={onRefine}
                        className="inline-flex items-center gap-2 rounded-sm bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                        <Wand2 className="size-4" />
                        Refine
                    </button>
                </div>
            </div>

            <div className="rounded-sm border border-slate-950/7 bg-slate-50 px-4 py-4">
                <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                    Next step
                </p>
                <div className="mt-3">
                    <Link
                        href="/"
                        className="rounded-sm border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-950/20 hover:bg-slate-50"
                    >
                        Preview storefront
                    </Link>
                </div>
            </div>
        </div>
    );
}
