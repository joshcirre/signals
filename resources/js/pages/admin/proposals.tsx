import { Head, Link, router, useForm } from '@inertiajs/react';
import { PencilLine, Save, ShieldCheck, ShieldX } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { storeBrand } from '@/lib/brand';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
import productRoutes from '@/routes/products';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: dashboard(),
    },
    {
        title: 'Proposal Queue',
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
            after?: string | null;
            response_draft?: string | null;
        };
    }>;
}

export default function ProposalQueue({
    filters,
    proposals,
}: ProposalQueueProps) {
    const statusFilter = filters.status;
    const [editingProposalId, setEditingProposalId] = useState<number | null>(
        null,
    );
    const form = useForm({
        content: '',
        rationale: '',
        confidence: 0.9,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Proposal Queue" />
            <div className="space-y-4 p-4 md:p-5">
                {/* Page header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-sm font-semibold text-slate-950">
                            Proposal queue
                        </h1>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Review, edit, and publish changes{' '}
                            {storeBrand.adminName} prepared.
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
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
                                    className={
                                        statusFilter === status
                                            ? 'rounded-md bg-slate-950 px-3 py-1.5 text-xs font-medium text-white'
                                            : 'rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100'
                                    }
                                >
                                    {status}
                                </button>
                            ),
                        )}
                    </div>
                </div>

                {/* Main layout */}
                <section className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
                    {/* Left: proposal list */}
                    <div className="overflow-hidden rounded-lg border border-slate-950/10 bg-white">
                        <div className="border-b border-slate-950/5 px-4 py-3">
                            <p className="text-xs font-medium text-slate-500">
                                {proposals.length} proposal
                                {proposals.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <ul role="list" className="divide-y divide-slate-950/5">
                            {proposals.map((proposal) => (
                                <li key={`summary-${proposal.id}`}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditingProposalId(proposal.id)
                                        }
                                        className={`w-full px-4 py-3 text-left ${
                                            editingProposalId === proposal.id
                                                ? 'bg-slate-950 text-white'
                                                : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <p
                                            className={`text-xs ${editingProposalId === proposal.id ? 'text-white/60' : 'text-slate-400'}`}
                                        >
                                            {proposal.type.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </p>
                                        <p className="mt-0.5 text-sm font-medium">
                                            {proposal.target_label}
                                        </p>
                                        <p
                                            className={`mt-0.5 text-xs ${editingProposalId === proposal.id ? 'text-white/50' : 'text-slate-400'}`}
                                        >
                                            {proposal.created_at}
                                        </p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right: proposal details */}
                    <div className="space-y-3">
                        {proposals.map((proposal) => {
                            const content =
                                proposal.type === 'review_response'
                                    ? (proposal.payload.response_draft ?? '')
                                    : (proposal.payload.after ?? '');
                            const isEditing =
                                editingProposalId === proposal.id;

                            return (
                                <article
                                    key={proposal.id}
                                    className={`rounded-lg border bg-white p-5 ${
                                        isEditing
                                            ? 'border-slate-950/30'
                                            : 'border-slate-950/10'
                                    }`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs text-slate-400">
                                                {proposal.type.replaceAll(
                                                    '_',
                                                    ' ',
                                                )}
                                            </p>
                                            <h2 className="mt-0.5 text-sm font-semibold text-slate-950">
                                                {proposal.target_label}
                                            </h2>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                                {(
                                                    proposal.confidence * 100
                                                ).toFixed(0)}
                                                %
                                            </span>
                                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                                {proposal.status}
                                            </span>
                                        </div>
                                    </div>

                                    {isEditing ? (
                                        <form
                                            className="mt-4 space-y-3"
                                            onSubmit={(event) => {
                                                event.preventDefault();
                                                form.patch(
                                                    admin.proposals.update({
                                                        proposal: proposal.id,
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
                                            <label className="block text-xs font-medium text-slate-700">
                                                Proposed content
                                                <textarea
                                                    value={form.data.content}
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'content',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="mt-1.5 min-h-28 w-full rounded-md border border-slate-950/10 px-3 py-2 text-sm outline-none focus:border-slate-950/30"
                                                />
                                            </label>
                                            <label className="block text-xs font-medium text-slate-700">
                                                Rationale
                                                <textarea
                                                    value={form.data.rationale}
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'rationale',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="mt-1.5 min-h-20 w-full rounded-md border border-slate-950/10 px-3 py-2 text-sm outline-none focus:border-slate-950/30"
                                                />
                                            </label>
                                            <label className="block text-xs font-medium text-slate-700">
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
                                                                event.target
                                                                    .value,
                                                            ),
                                                        )
                                                    }
                                                    className="mt-1.5 w-full rounded-md border border-slate-950/10 px-3 py-2 text-sm outline-none focus:border-slate-950/30"
                                                />
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="submit"
                                                    disabled={form.processing}
                                                    className="inline-flex items-center gap-2 rounded-lg bg-slate-950 py-2 pl-2 pr-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                                                >
                                                    <Save className="size-4 shrink-0" />
                                                    Save edits
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEditingProposalId(
                                                            null,
                                                        )
                                                    }
                                                    className="rounded-lg border border-slate-950/10 px-3 py-2 text-sm font-medium text-slate-600 hover:border-slate-950/30"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <p className="mt-3 text-sm text-pretty text-slate-500">
                                                {proposal.rationale}
                                            </p>
                                            <div className="mt-3 rounded bg-slate-50 p-3">
                                                <p className="text-xs font-medium text-slate-700">
                                                    {proposal.type ===
                                                    'review_response'
                                                        ? 'Suggested response'
                                                        : 'Suggested change'}
                                                </p>
                                                <p className="mt-1.5 text-sm text-pretty text-slate-600">
                                                    {content}
                                                </p>
                                            </div>
                                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                                {proposal.status ===
                                                'pending' ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                form.setData({
                                                                    content,
                                                                    rationale:
                                                                        proposal.rationale,
                                                                    confidence:
                                                                        proposal.confidence,
                                                                });
                                                                setEditingProposalId(
                                                                    proposal.id,
                                                                );
                                                            }}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-950/10 py-1.5 pl-1.5 pr-3 text-xs font-medium text-slate-600 hover:border-slate-950/30"
                                                        >
                                                            <PencilLine className="size-4 shrink-0" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                router.post(
                                                                    admin.proposals.approve(
                                                                        {
                                                                            proposal:
                                                                                proposal.id,
                                                                        },
                                                                    ).url,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 py-1.5 pl-1.5 pr-3 text-xs font-medium text-white hover:bg-slate-800"
                                                        >
                                                            <ShieldCheck className="size-4 shrink-0" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                router.post(
                                                                    admin.proposals.reject(
                                                                        {
                                                                            proposal:
                                                                                proposal.id,
                                                                        },
                                                                    ).url,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-950/10 py-1.5 pl-1.5 pr-3 text-xs font-medium text-slate-600 hover:border-slate-950/30"
                                                        >
                                                            <ShieldX className="size-4 shrink-0" />
                                                            Reject
                                                        </button>
                                                    </>
                                                ) : null}
                                                {proposal.target_slug ? (
                                                    <Link
                                                        href={
                                                            productRoutes.show({
                                                                product:
                                                                    proposal.target_slug,
                                                            }).url
                                                        }
                                                        className="rounded-lg border border-slate-950/10 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-950/30"
                                                    >
                                                        Preview storefront
                                                    </Link>
                                                ) : null}
                                            </div>
                                        </>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
