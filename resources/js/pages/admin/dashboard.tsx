import { Head, Link, router } from '@inertiajs/react';
import { Activity, ArrowRight } from 'lucide-react';
import { FormEvent, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { storeBrand } from '@/lib/brand';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

interface DashboardProps {
    onboarding: {
        needs_helper_setup: boolean;
    };
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

export default function AdminDashboard({
    onboarding,
    stats,
    latestRun,
    latestAppliedChange,
    recentActions,
}: DashboardProps) {
    const [searchTerm, setSearchTerm] = useState(
        'hoodie reviews about sizing',
    );

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        router.get(admin.signals().url, { q: searchTerm });
    };

    const statItems = [
        { label: 'Products', value: stats.products },
        { label: 'Awaiting analysis', value: stats.new_reviews },
        { label: 'Low-rating reviews', value: stats.negative_reviews },
        { label: 'Pending proposals', value: stats.pending_proposals },
    ];

    // Border classes for the 4-up stat grid at 1/2/4 columns
    const statBorderClasses = [
        '',
        'border-t border-slate-950/5 sm:border-t-0 sm:border-l',
        'border-t border-slate-950/5 sm:border-l-0 xl:border-t-0 xl:border-l',
        'border-t border-slate-950/5 sm:border-l xl:border-t-0',
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-6 p-4 md:p-6">
                {/* Onboarding banner */}
                {onboarding.needs_helper_setup ? (
                    <section className="rounded-xl border border-sky-200 bg-sky-50 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-xs font-medium text-sky-600">
                                    Setup required
                                </p>
                                <h2 className="mt-1 text-base font-semibold text-slate-900">
                                    Start the local Signals helper before running
                                    your first analysis.
                                </h2>
                                <p className="mt-1 max-w-[48ch] text-sm text-pretty text-slate-600">
                                    Issue a helper token in Signals, run the Node
                                    bridge on your laptop, then click Analyze New
                                    Reviews.
                                </p>
                            </div>
                            <Link
                                href={admin.signals().url}
                                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-950/10 py-2 pl-3 pr-3 text-sm font-medium text-slate-700 hover:bg-white"
                            >
                                Open Signals setup
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </section>
                ) : null}

                {/* Demo flow — 3 steps */}
                <section className="grid gap-4 lg:grid-cols-3">
                    <Link
                        href={admin.signals().url}
                        className="group flex flex-col gap-4 rounded-xl border border-slate-950/10 bg-white p-6 hover:border-slate-400"
                    >
                        <div className="flex items-start justify-between">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
                                1
                            </span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-950">
                                Search reviews
                            </h3>
                            <p className="mt-1 max-w-[48ch] text-sm text-pretty text-slate-500">
                                Ask in natural language — "hoodie reviews about
                                sizing" — and watch the local Codex helper stream
                                MCP tool usage back live.
                            </p>
                        </div>
                        <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-slate-950">
                            Open Signals
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                    </Link>

                    <Link
                        href={admin.proposals.index().url}
                        className="group flex flex-col gap-4 rounded-xl border border-slate-950/10 bg-white p-6 hover:border-slate-400"
                    >
                        <div className="flex items-start justify-between">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
                                2
                            </span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-950">
                                Review proposals
                            </h3>
                            <p className="mt-1 max-w-[48ch] text-sm text-pretty text-slate-500">
                                Codex surfaces fit-note and FAQ changes ranked by
                                confidence. You decide which ones make it to the
                                storefront.
                            </p>
                        </div>
                        <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-slate-950">
                            Open proposals
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                    </Link>

                    <Link
                        href="/"
                        className="group flex flex-col gap-4 rounded-xl border border-slate-950/10 bg-white p-6 hover:border-slate-400"
                    >
                        <div className="flex items-start justify-between">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
                                3
                            </span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-950">
                                See it on the storefront
                            </h3>
                            <p className="mt-1 max-w-[48ch] text-sm text-pretty text-slate-500">
                                Approved changes publish immediately. Refresh the
                                product page and the updated fit note or FAQ
                                appears for shoppers.
                            </p>
                        </div>
                        <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-slate-950">
                            View storefront
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                    </Link>
                </section>

                {/* Quick search — primary action */}
                <section className="rounded-xl border border-slate-950/10 bg-white p-6">
                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Quick start
                        </p>
                        <h2 className="mt-1 text-base font-semibold text-slate-950">
                            Jump straight into the demo
                        </h2>
                    </div>
                    <form
                        onSubmit={submitSearch}
                        className="mt-4 flex flex-col gap-2 sm:flex-row"
                    >
                        <input
                            name="q"
                            aria-label="Search reviews"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(event.target.value)
                            }
                            className="w-full rounded-lg px-4 py-2.5 text-sm ring-1 ring-slate-950/10 outline-none focus:ring-2 focus:ring-slate-950/20"
                        />
                        <button
                            type="submit"
                            className="shrink-0 rounded-lg bg-slate-950 py-2.5 pl-4 pr-4 text-sm font-medium text-white hover:bg-slate-800"
                        >
                            Search in Signals
                        </button>
                    </form>
                </section>

                {/* Stats — divider-separated, no icons */}
                <section className="overflow-hidden rounded-xl border border-slate-950/10 bg-white">
                    <dl className="grid sm:grid-cols-2 xl:grid-cols-4">
                        {statItems.map(({ label, value }, i) => (
                            <div
                                key={label}
                                className={`px-6 py-5 ${statBorderClasses[i]}`}
                            >
                                <dt className="truncate text-sm text-slate-500">
                                    {label}
                                </dt>
                                <dd className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                                    {value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>

                {/* Latest run + applied change */}
                <section className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-950/10 bg-white p-6">
                        <p className="text-xs font-medium text-slate-500">
                            Latest analysis run
                        </p>
                        {latestRun ? (
                            <div className="mt-4 space-y-3">
                                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                    {latestRun.status}
                                </span>
                                <p className="text-base font-medium text-slate-900">
                                    {latestRun.summary}
                                </p>
                                <p className="text-sm text-slate-400">
                                    {latestRun.requested_at}
                                </p>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-slate-400">
                                No analysis runs queued yet. Use Signals to
                                start one.
                            </p>
                        )}
                    </div>

                    <div className="rounded-xl border border-slate-950/10 bg-white p-6">
                        <p className="text-xs font-medium text-slate-500">
                            Latest approved change
                        </p>
                        {latestAppliedChange ? (
                            <div className="mt-4 space-y-2">
                                <p className="font-medium capitalize text-slate-900">
                                    {latestAppliedChange.type.replaceAll(
                                        '_',
                                        ' ',
                                    )}
                                </p>
                                <p className="text-sm text-pretty text-slate-500">
                                    {latestAppliedChange.rationale}
                                </p>
                                <p className="text-sm text-slate-400">
                                    {latestAppliedChange.applied_at ??
                                        'Awaiting publication timestamp'}
                                </p>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-slate-400">
                                No proposals approved yet.
                            </p>
                        )}
                    </div>
                </section>

                {/* Recent activity */}
                {recentActions.length > 0 ? (
                    <section className="rounded-xl border border-slate-950/10 bg-white p-6">
                        <div className="flex items-center gap-2">
                            <Activity className="size-4 text-slate-400" />
                            <p className="text-xs font-medium text-slate-500">
                                Recent activity
                            </p>
                        </div>
                        <div className="mt-4 divide-y divide-slate-950/5">
                            {recentActions.map((action) => (
                                <div
                                    key={action.id}
                                    className="flex items-center justify-between gap-4 py-3"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {action.action}
                                        </p>
                                        {action.message ? (
                                            <p className="text-xs text-slate-400">
                                                {action.message}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="shrink-0 text-right text-xs text-slate-400">
                                        <p>{action.actor_type}</p>
                                        <p>{action.created_at}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ) : null}
            </div>
        </AppLayout>
    );
}
