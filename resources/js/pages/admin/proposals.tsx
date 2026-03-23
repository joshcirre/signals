import { Head, Link, router, useForm } from '@inertiajs/react';
import { PencilLine, Save, ShieldCheck, ShieldX } from 'lucide-react';
import { useState } from 'react';
import {
    AdminHeader,
    AdminPage,
    AdminPill,
    AdminSurface,
    AdminSurfaceBody,
    AdminSurfaceHeader,
} from '@/components/admin-page';
import AppLayout from '@/layouts/app-layout';
import { storeBrand } from '@/lib/brand';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
import productRoutes from '@/routes/products';

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

interface ProposalQueueProps {
    filters: {
        status: string;
    };
    proposals: Array<{
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
        };
    }>;
}

function proposalFieldLabel(field: string | null | undefined): string {
    if (!field) {
        return 'Storefront copy';
    }

    return field.replaceAll('_', ' ');
}

export default function ProposalQueue({
    filters,
    proposals,
}: ProposalQueueProps) {
    const statusFilter = filters.status;
    const [selectedProposalId, setSelectedProposalId] = useState<number | null>(
        proposals[0]?.id ?? null,
    );
    const [editingProposalId, setEditingProposalId] = useState<number | null>(
        null,
    );
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Review" />

            <AdminPage>
                <AdminHeader
                    eyebrow="Review"
                    title="Review resolutions"
                    description={
                        <>
                            Keep this page operator-simple: choose the best
                            proposal, make a decision, then move to the
                            storefront or a follow-up adaptation session.{' '}
                            {storeBrand.adminName} should never feel like a
                            cluttered queue manager.
                        </>
                    }
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
                        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-950/8 bg-slate-50 p-1">
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
                                            'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition',
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
                            description="Pick the single proposal worth deciding now."
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
                                            'w-full rounded-lg border px-3 py-3 text-left transition',
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
                                                    {proposal.target_label}
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
                                                    'rounded-full px-2 py-1 text-[10px] font-semibold',
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
                                <div className="rounded-lg border border-dashed border-slate-950/8 px-3 py-6 text-sm leading-6 text-slate-500">
                                    No proposals match the current filter.
                                </div>
                            )}
                        </AdminSurfaceBody>
                    </AdminSurface>

                    <AdminSurface>
                        <AdminSurfaceHeader
                            title={
                                selectedProposal
                                    ? selectedProposal.target_label
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
                                isEditingSelected ? (
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
                                                className="mt-2 min-h-40 w-full rounded-lg border border-slate-950/10 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none focus:border-slate-950/20 focus:ring-2 focus:ring-slate-950/5"
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
                                                className="mt-2 min-h-28 w-full rounded-lg border border-slate-950/10 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none focus:border-slate-950/20 focus:ring-2 focus:ring-slate-950/5"
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
                                                className="mt-2 w-full rounded-lg border border-slate-950/10 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-950/20 focus:ring-2 focus:ring-slate-950/5"
                                            />
                                        </label>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="submit"
                                                disabled={form.processing}
                                                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                                            >
                                                <Save className="size-4" />
                                                Save edits
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEditingProposalId(null)
                                                }
                                                className="rounded-lg border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-950/20 hover:bg-slate-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div className="grid gap-3 md:grid-cols-3">
                                            <div className="rounded-lg border border-slate-950/7 bg-slate-50 px-3.5 py-3">
                                                <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                    Created
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-slate-950">
                                                    {
                                                        selectedProposal.created_at
                                                    }
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-slate-950/7 bg-slate-50 px-3.5 py-3">
                                                <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                    Status
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-slate-950 capitalize">
                                                    {selectedProposal.status}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-slate-950/7 bg-slate-50 px-3.5 py-3">
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

                                        <div className="rounded-lg border border-slate-950/7 bg-slate-50 px-4 py-4">
                                            <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                Rationale
                                            </p>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                {selectedProposal.rationale}
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-slate-950/7 bg-white px-4 py-4">
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
                                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
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
                                                        className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
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
                                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-950/20 hover:bg-slate-50"
                                                    >
                                                        <ShieldX className="size-4" />
                                                        Reject
                                                    </button>
                                                </>
                                            ) : null}
                                        </div>

                                        <div className="rounded-lg border border-slate-950/7 bg-slate-50 px-4 py-4">
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
                                                        className="rounded-lg border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-950/20 hover:bg-slate-50"
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
                                                        className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
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
                                <div className="rounded-lg border border-dashed border-slate-950/8 px-4 py-10 text-sm leading-6 text-slate-500">
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
