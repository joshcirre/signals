import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ClipboardList,
    PencilLine,
    Save,
    Search,
    ShieldCheck,
    ShieldX,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
            <div className="space-y-8 p-4 md:p-6">
                <section className="rounded-[2rem] bg-[linear-gradient(135deg,_#0f172a_0%,_#111827_55%,_#334155_100%)] p-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
                    <Badge className="rounded-full border-white/12 bg-white/12 px-3 py-1 text-[0.68rem] tracking-[0.24em] text-white uppercase hover:bg-white/12">
                        <ClipboardList className="size-3.5" />
                        Proposal Queue
                    </Badge>
                    <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                        Review, edit, and publish the merchant-facing changes
                        Codex prepared.
                    </h1>
                    <p className="mt-4 max-w-3xl text-base leading-7 text-white/78">
                        {storeBrand.adminName} keeps the risky step explicit.
                        Proposed shopper-facing changes can be tightened by
                        hand, then approved into the storefront immediately.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        {['pending', 'applied', 'rejected', 'all'].map(
                            (status) => (
                                <Button
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
                                    className={`rounded-full ${
                                        statusFilter === status
                                            ? 'bg-white text-slate-900'
                                            : 'border-white/20 bg-white/8 text-white hover:border-white/40 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {status}
                                </Button>
                            ),
                        )}
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
                    <Card className="rounded-[2rem] border-white/80 bg-white/82 py-0 shadow-sm backdrop-blur">
                        <CardContent className="px-6 py-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Queue summary
                                </h2>
                                <Search className="size-5 text-slate-400" />
                            </div>
                            <p className="mt-4 text-sm leading-6 text-slate-600">
                                Pending proposals are the clearest demo surface
                                for trust. Edit them when needed, approve the
                                strongest one, and use the storefront as the
                                before-and-after payoff.
                            </p>
                            <div className="mt-6 space-y-3">
                                {proposals.map((proposal) => (
                                    <button
                                        key={`summary-${proposal.id}`}
                                        type="button"
                                        onClick={() =>
                                            setEditingProposalId(proposal.id)
                                        }
                                        className={`block w-full rounded-2xl border px-4 py-4 text-left transition ${
                                            editingProposalId === proposal.id
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300'
                                        }`}
                                    >
                                        <p className="text-xs tracking-[0.2em] uppercase opacity-70">
                                            {proposal.type.replaceAll('_', ' ')}
                                        </p>
                                        <p className="mt-2 font-semibold">
                                            {proposal.target_label}
                                        </p>
                                        <p className="mt-2 text-sm opacity-80">
                                            {proposal.created_at}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        {proposals.map((proposal) => {
                            const content =
                                proposal.type === 'review_response'
                                    ? (proposal.payload.response_draft ?? '')
                                    : (proposal.payload.after ?? '');
                            const isEditing = editingProposalId === proposal.id;

                            return (
                                <article
                                    key={proposal.id}
                                    className={`rounded-[2rem] border p-6 shadow-sm transition ${
                                        isEditing
                                            ? 'border-slate-900 bg-white'
                                            : 'border-slate-200 bg-white'
                                    }`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs tracking-[0.2em] text-slate-500 uppercase">
                                                {proposal.type.replaceAll(
                                                    '_',
                                                    ' ',
                                                )}
                                            </p>
                                            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                                {proposal.target_label}
                                            </h2>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                                                {(
                                                    proposal.confidence * 100
                                                ).toFixed(0)}
                                                %
                                            </span>
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                                {proposal.status}
                                            </span>
                                        </div>
                                    </div>

                                    {isEditing ? (
                                        <form
                                            className="mt-5 space-y-4"
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
                                            <label className="block text-sm font-medium text-slate-700">
                                                Proposed content
                                                <textarea
                                                    value={form.data.content}
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'content',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="mt-2 min-h-32 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm transition outline-none focus:border-slate-900"
                                                />
                                            </label>
                                            <label className="block text-sm font-medium text-slate-700">
                                                Rationale
                                                <textarea
                                                    value={form.data.rationale}
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'rationale',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="mt-2 min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm transition outline-none focus:border-slate-900"
                                                />
                                            </label>
                                            <label className="block text-sm font-medium text-slate-700">
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
                                                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm transition outline-none focus:border-slate-900"
                                                />
                                            </label>
                                            <div className="flex flex-wrap gap-3">
                                                <button
                                                    type="submit"
                                                    disabled={form.processing}
                                                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                                                >
                                                    <Save className="size-4" />
                                                    Save edits
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEditingProposalId(
                                                            null,
                                                        )
                                                    }
                                                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <p className="mt-4 text-sm leading-7 text-slate-600">
                                                {proposal.rationale}
                                            </p>
                                            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                                                <p className="font-medium text-slate-900">
                                                    {proposal.type ===
                                                    'review_response'
                                                        ? 'Suggested response'
                                                        : 'Suggested change'}
                                                </p>
                                                <p className="mt-2 text-sm leading-7 text-slate-600">
                                                    {content}
                                                </p>
                                            </div>
                                            <div className="mt-5 flex flex-wrap gap-3">
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
                                                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
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
                                                                                proposal.id,
                                                                        },
                                                                    ).url,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                                                        >
                                                            <ShieldCheck className="size-4" />
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
                                                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                                                        >
                                                            <ShieldX className="size-4" />
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
                                                        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
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
