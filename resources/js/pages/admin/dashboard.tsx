import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    CirclePlay,
    ClipboardList,
    Radar,
    ShoppingBag,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
    AdminHeader,
    AdminMetric,
    AdminPage,
    AdminPill,
    AdminSurface,
    AdminSurfaceBody,
    AdminSurfaceHeader,
} from '@/components/admin-page';
import AppLayout from '@/layouts/app-layout';
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
    const [searchTerm, setSearchTerm] = useState('hoodie reviews about sizing');

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        router.get(admin.signals().url, { q: searchTerm });
    };

    const nextStep = onboarding.needs_helper_setup
        ? {
              title: 'Connect the local helper before anything else.',
              description:
                  'Issue a helper token, run the local bridge, and then start the first analysis from Signals.',
              href: admin.signals().url,
              label: 'Open helper setup',
          }
        : stats.pending_proposals > 0
          ? {
                title: 'There are proposals ready for review.',
                description:
                    'Move straight into the queue and approve the highest-confidence changes first.',
                href: admin.proposals.index().url,
                label: 'Review proposal queue',
            }
          : {
                title: 'Search review intelligence and queue a run.',
                description:
                    'Start with a natural-language query, inspect the live run, and let Signals prepare storefront changes.',
                href: admin.signals().url,
                label: 'Open Signals',
            };

    const statItems = [
        {
            label: 'Products',
            value: stats.products,
            detail: 'Catalog items monitored by Signals.',
        },
        {
            label: 'Awaiting analysis',
            value: stats.new_reviews,
            detail: 'Fresh reviews ready for the next run.',
        },
        {
            label: 'Low-rating reviews',
            value: stats.negative_reviews,
            detail: 'Potential pain points worth reviewing.',
        },
        {
            label: 'Pending proposals',
            value: stats.pending_proposals,
            detail: 'Changes waiting for approval.',
        },
    ];

    const flowSteps = [
        {
            step: '01',
            title: 'Search Signals',
            description: 'Find the review cluster worth demonstrating.',
            href: admin.signals().url,
            label: 'Open Signals',
            icon: Radar,
        },
        {
            step: '02',
            title: 'Review proposals',
            description: 'Approve or edit the change that should publish.',
            href: admin.proposals.index().url,
            label: 'Open queue',
            icon: ClipboardList,
        },
        {
            step: '03',
            title: 'Verify storefront',
            description: 'Refresh the product page and confirm the update.',
            href: '/',
            label: 'Open storefront',
            icon: ShoppingBag,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <AdminPage>
                <AdminHeader
                    eyebrow="Overview"
                    title="Signals admin"
                    description="A compact control room for the demo flow: find the signal, review the change, and confirm it on the storefront without hunting through oversized cards."
                    meta={
                        <>
                            <AdminPill>
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                {latestRun
                                    ? `Latest run ${latestRun.status}`
                                    : 'No run yet'}
                            </AdminPill>
                            <AdminPill>
                                <span className="size-1.5 rounded-full bg-slate-300" />
                                {stats.pending_proposals} pending proposals
                            </AdminPill>
                        </>
                    }
                    actions={
                        <>
                            <Link
                                href={admin.signals().url}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                            >
                                <Radar className="size-4" />
                                Signals
                            </Link>
                            <Link
                                href={admin.proposals.index().url}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                            >
                                <ClipboardList className="size-4" />
                                Proposals
                            </Link>
                        </>
                    }
                />

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
                    <AdminSurface>
                        <AdminSurfaceBody className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                            <div className="space-y-5">
                                {onboarding.needs_helper_setup ? (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                        <p className="font-medium">
                                            Helper setup is still required.
                                        </p>
                                        <p className="mt-1 leading-6 text-amber-800/90">
                                            Start the local Signals helper so
                                            analysis runs can stream back into
                                            this workspace.
                                        </p>
                                    </div>
                                ) : null}

                                <div className="space-y-2">
                                    <p className="text-[11px] font-medium tracking-[0.22em] text-slate-400 uppercase">
                                        Recommended next step
                                    </p>
                                    <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                                        {nextStep.title}
                                    </h2>
                                    <p className="max-w-2xl text-sm leading-6 text-slate-600">
                                        {nextStep.description}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Link
                                        href={nextStep.href}
                                        className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                                    >
                                        <CirclePlay className="size-4" />
                                        {nextStep.label}
                                    </Link>
                                    {latestRun ? (
                                        <Link
                                            href={
                                                admin.reviewRuns.show(
                                                    latestRun.id,
                                                ).url
                                            }
                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                                        >
                                            Latest run
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    ) : null}
                                </div>

                                <form
                                    onSubmit={submitSearch}
                                    className="rounded-lg border border-slate-950/8 bg-slate-50/80 p-3"
                                >
                                    <div className="flex flex-col gap-3 lg:flex-row">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-medium tracking-[0.2em] text-slate-400 uppercase">
                                                Quick start query
                                            </p>
                                            <input
                                                name="q"
                                                aria-label="Search reviews"
                                                value={searchTerm}
                                                onChange={(event) =>
                                                    setSearchTerm(
                                                        event.target.value,
                                                    )
                                                }
                                                className="mt-2 w-full rounded-lg border border-slate-950/10 bg-white px-3 py-2.5 text-sm text-slate-900 transition outline-none focus:border-slate-950/20 focus:ring-2 focus:ring-slate-950/5"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-slate-900 ring-1 ring-slate-950/10 transition hover:bg-slate-100"
                                        >
                                            Search in Signals
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="grid gap-3">
                                {statItems.slice(1, 4).map((item) => (
                                    <AdminMetric
                                        key={item.label}
                                        label={item.label}
                                        value={item.value}
                                        detail={item.detail}
                                    />
                                ))}
                            </div>
                        </AdminSurfaceBody>
                    </AdminSurface>

                    <AdminSurface>
                        <AdminSurfaceHeader
                            title="Demo path"
                            description="A smaller, clearer path from signal to published change."
                        />
                        <AdminSurfaceBody className="space-y-3">
                            {flowSteps.map((step) => (
                                <Link
                                    key={step.step}
                                    href={step.href}
                                    className="group flex items-start gap-3 rounded-lg border border-slate-950/8 bg-slate-50/80 px-3 py-3 transition hover:border-slate-950/20 hover:bg-white"
                                >
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-950/10 bg-white text-[11px] font-semibold tracking-[0.16em] text-slate-500">
                                        {step.step}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <step.icon className="size-4 text-slate-400" />
                                            <p className="text-sm font-medium text-slate-950">
                                                {step.title}
                                            </p>
                                        </div>
                                        <p className="mt-1 text-sm leading-5 text-slate-500">
                                            {step.description}
                                        </p>
                                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition group-hover:text-slate-900">
                                            {step.label}
                                            <ArrowRight className="size-3.5" />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </AdminSurfaceBody>
                    </AdminSurface>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {statItems.map((item) => (
                        <AdminMetric
                            key={item.label}
                            label={item.label}
                            value={item.value}
                            detail={item.detail}
                        />
                    ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
                    <AdminSurface>
                        <AdminSurfaceHeader
                            title="Latest analysis"
                            description="The most recent review run in this workspace."
                        />
                        <AdminSurfaceBody className="space-y-3">
                            {latestRun ? (
                                <>
                                    <AdminPill className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                        {latestRun.status}
                                    </AdminPill>
                                    <p className="text-sm leading-6 text-slate-700">
                                        {latestRun.summary ??
                                            'No summary was attached to the last run yet.'}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Requested {latestRun.requested_at}
                                    </p>
                                    <Link
                                        href={
                                            admin.reviewRuns.show(latestRun.id)
                                                .url
                                        }
                                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950"
                                    >
                                        Open run trace
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </>
                            ) : (
                                <p className="text-sm leading-6 text-slate-500">
                                    No analysis runs have been queued yet. Start
                                    in Signals and the live trace will appear
                                    here.
                                </p>
                            )}
                        </AdminSurfaceBody>
                    </AdminSurface>

                    <AdminSurface>
                        <AdminSurfaceHeader
                            title="Latest approved change"
                            description="The newest storefront update that made it through review."
                        />
                        <AdminSurfaceBody className="space-y-3">
                            {latestAppliedChange ? (
                                <>
                                    <p className="text-sm font-medium text-slate-950 capitalize">
                                        {latestAppliedChange.type.replaceAll(
                                            '_',
                                            ' ',
                                        )}
                                    </p>
                                    <p className="text-sm leading-6 text-slate-600">
                                        {latestAppliedChange.rationale}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {latestAppliedChange.applied_at ??
                                            'Awaiting publication timestamp'}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm leading-6 text-slate-500">
                                    No proposals have been approved yet. Review
                                    the queue once the next run finishes.
                                </p>
                            )}
                        </AdminSurfaceBody>
                    </AdminSurface>

                    <AdminSurface>
                        <AdminSurfaceHeader
                            title="Recent activity"
                            description="A dense feed of the latest system and operator actions."
                            action={
                                <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
                                    <Activity className="size-4" />
                                    {recentActions.length} events
                                </span>
                            }
                        />
                        <AdminSurfaceBody className="space-y-0 p-0">
                            {recentActions.length > 0 ? (
                                recentActions.map((action, index) => (
                                    <div
                                        key={action.id}
                                        className={`px-4 py-3 ${
                                            index === 0
                                                ? ''
                                                : 'border-t border-slate-950/6'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {action.action}
                                                </p>
                                                {action.message ? (
                                                    <p className="mt-1 text-sm leading-5 text-slate-500">
                                                        {action.message}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <span className="shrink-0 text-xs text-slate-400">
                                                {action.created_at}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                            {action.actor_type}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-6 text-sm text-slate-500">
                                    Activity will appear here after the next
                                    analysis or review action.
                                </div>
                            )}
                        </AdminSurfaceBody>
                    </AdminSurface>
                </div>
            </AdminPage>
        </AppLayout>
    );
}
