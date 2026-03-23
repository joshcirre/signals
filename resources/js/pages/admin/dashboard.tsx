import { Head, Link } from '@inertiajs/react';
import { Activity, ClipboardList, MessageSquareWarning, Search, ShoppingBag, type LucideIcon } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: dashboard(),
    },
];

interface DashboardProps {
    stats: {
        products: number;
        new_reviews: number;
        negative_reviews: number;
        pending_proposals: number;
    };
    latestRun: {
        id: number;
        status: string;
        summary: string | null;
        requested_at: string | null;
    } | null;
    latestAppliedChange: {
        id: number;
        type: string;
        rationale: string;
        target_type: string;
        target_id: number;
        applied_at: string | null;
    } | null;
    recentActions: Array<{
        id: number;
        action: string;
        actor_type: string;
        message: string | null;
        created_at: string;
    }>;
}

interface StatCard {
    label: string;
    value: number;
    icon: LucideIcon;
}

export default function AdminDashboard({
    stats,
    latestRun,
    latestAppliedChange,
    recentActions,
}: DashboardProps) {
    const cards: StatCard[] = [
        { label: 'Products', value: stats.products, icon: ShoppingBag },
        { label: 'Awaiting analysis', value: stats.new_reviews, icon: Search },
        { label: 'Low-rating reviews', value: stats.negative_reviews, icon: MessageSquareWarning },
        { label: 'Pending proposals', value: stats.pending_proposals, icon: ClipboardList },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="space-y-8 p-4 md:p-6">
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {cards.map(({ label, value, icon: Icon }) => (
                        <div
                            key={label}
                            className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-500">{label}</p>
                                <Icon className="size-5 text-slate-400" />
                            </div>
                            <p className="mt-5 text-4xl font-semibold tracking-tight">
                                {value}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                    <div className="rounded-[2rem] bg-[linear-gradient(135deg,_#111827_0%,_#1f2937_55%,_#334155_100%)] p-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.3)]">
                        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-white/70">
                            <Activity className="size-4" />
                            ReviewOps
                        </div>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                            Stream live Codex analysis, inspect proposals, and push storefront updates with approval.
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
                            The primary demo loop lives in ReviewOps. Search reviews semantically, watch the local helper claim a run, and approve the best proposal for immediate storefront impact.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href={admin.reviewOps().url}
                                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                            >
                                Open ReviewOps
                            </Link>
                            <Link
                                href={admin.auditLog().url}
                                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                            >
                                Open Audit Log
                            </Link>
                            <Link
                                href="/"
                                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                            >
                                View Storefront
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
                            Latest Run
                        </p>
                        {latestRun ? (
                            <div className="mt-5 space-y-4">
                                <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                                    {latestRun.status}
                                </div>
                                <p className="text-lg font-semibold text-slate-900">
                                    {latestRun.summary}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {latestRun.requested_at}
                                </p>
                            </div>
                        ) : (
                            <p className="mt-5 text-sm text-slate-500">
                                No review analysis runs have been queued yet.
                            </p>
                        )}
                    </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    {latestAppliedChange ? (
                        <div className="mb-6 rounded-[1.5rem] bg-slate-50 p-5">
                            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
                                Latest Approved Change
                            </p>
                            <p className="mt-3 text-lg font-semibold text-slate-900">
                                {latestAppliedChange.type.replaceAll('_', ' ')}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                {latestAppliedChange.rationale}
                            </p>
                            <p className="mt-3 text-sm text-slate-500">
                                {latestAppliedChange.applied_at ?? 'Awaiting publication timestamp'}
                            </p>
                        </div>
                    ) : null}
                    <h2 className="text-xl font-semibold text-slate-900">Recent actions</h2>
                    <div className="mt-5 space-y-4">
                        {recentActions.map((action) => (
                            <div
                                key={action.id}
                                className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
                            >
                                <div>
                                    <p className="font-medium text-slate-900">{action.action}</p>
                                    <p className="text-sm text-slate-500">{action.message}</p>
                                </div>
                                <div className="text-sm text-slate-500">
                                    {action.actor_type} · {action.created_at}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
