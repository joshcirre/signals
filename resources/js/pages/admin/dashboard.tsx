import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CirclePlay,
    ClipboardList,
    Radar,
    ShoppingBag,
} from 'lucide-react';
import {
    AdminHeader,
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
        title: 'Start',
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
    const nextStep = onboarding.needs_helper_setup
        ? {
              title: 'Create the helper first.',
              description:
                  'Everything becomes clearer once the local helper is connected. After that, the product reads as one focused session instead of an admin dashboard.',
              href: admin.signals().url,
              label: 'Open session setup',
          }
        : stats.pending_proposals > 0
          ? {
                title: 'Review the proposed resolution next.',
                description:
                    'The best demo is a straight line: one session, one proposed change, one publish decision.',
                href: admin.proposals.index().url,
                label: 'Open review',
            }
          : {
                title: 'Start a focused Signals session.',
                description:
                    'Open the session workspace, focus the run on one customer issue, and let the stream explain what is happening in real time.',
                href: admin.signals().url,
                label: 'Open session',
            };

    const flowSteps = [
        {
            label: '01',
            title: 'Run one focused session',
            description:
                'Search or type the issue you want to demo, then start the live session.',
            href: admin.signals().url,
            icon: Radar,
        },
        {
            label: '02',
            title: 'Approve the best resolution',
            description:
                'Move straight into review when the session produces a proposal worth publishing.',
            href: admin.proposals.index().url,
            icon: ClipboardList,
        },
        {
            label: '03',
            title: 'Verify the storefront',
            description:
                'Show the shopper-facing change only after the operator decision is made.',
            href: '/',
            icon: ShoppingBag,
        },
    ];

    const statusItems = [
        {
            label: 'Helper',
            value: onboarding.needs_helper_setup ? 'Needs setup' : 'Connected',
            detail: onboarding.needs_helper_setup
                ? 'Start in Session and copy the bootstrap command.'
                : 'Ready to claim the next run.',
        },
        {
            label: 'Queued review',
            value: `${stats.new_reviews} new`,
            detail: `${stats.negative_reviews} low-rating reviews need attention.`,
        },
        {
            label: 'Review queue',
            value: `${stats.pending_proposals} pending`,
            detail:
                stats.pending_proposals > 0
                    ? 'A resolution is waiting for operator approval.'
                    : 'No proposals are waiting right now.',
        },
        {
            label: 'Catalog',
            value: `${stats.products} products`,
            detail: 'Enough context for a tight end-to-end demo.',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Start" />

            <AdminPage>
                <AdminHeader
                    eyebrow="Start"
                    title="One clean demo path"
                    description="Signals should read like a product walkthrough, not an admin console. Start the helper, run one focused session, approve one resolution, then show the storefront change."
                    meta={
                        <>
                            <AdminPill>
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                {onboarding.needs_helper_setup
                                    ? 'Helper offline'
                                    : 'Helper ready'}
                            </AdminPill>
                            <AdminPill>
                                <span className="size-1.5 rounded-full bg-slate-300" />
                                {stats.pending_proposals} pending
                            </AdminPill>
                        </>
                    }
                />

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_320px]">
                    <AdminSurface>
                        <AdminSurfaceBody className="space-y-6 p-6">
                            <div className="space-y-2">
                                <p className="text-[10px] font-medium tracking-[0.2em] text-slate-400 uppercase">
                                    Recommended next step
                                </p>
                                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                                    {nextStep.title}
                                </h2>
                                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                                    {nextStep.description}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href={nextStep.href}
                                    className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                                >
                                    <CirclePlay className="size-4" />
                                    {nextStep.label}
                                </Link>
                                {latestRun ? (
                                    <Link
                                        href={
                                            admin.reviewRuns.show(latestRun.id)
                                                .url
                                        }
                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-950/10 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                                    >
                                        Open latest trace
                                        <ArrowRight className="size-4" />
                                    </Link>
                                ) : null}
                            </div>

                            {onboarding.needs_helper_setup ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                                    The first thing a new operator should see is
                                    the helper setup. Once that is connected,
                                    the whole flow collapses into a simple live
                                    session.
                                </div>
                            ) : null}

                            <div className="grid gap-3 md:grid-cols-3">
                                {flowSteps.map((step) => (
                                    <Link
                                        key={step.label}
                                        href={step.href}
                                        className="group rounded-lg border border-slate-950/8 bg-slate-50 px-4 py-4 transition hover:border-slate-950/20 hover:bg-white"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex size-7 items-center justify-center rounded-full border border-slate-950/10 bg-white text-[10px] font-semibold tracking-[0.16em] text-slate-500">
                                                {step.label}
                                            </span>
                                            <step.icon className="size-4 text-slate-400" />
                                        </div>
                                        <p className="mt-4 text-sm font-medium text-slate-950">
                                            {step.title}
                                        </p>
                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            {step.description}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </AdminSurfaceBody>
                    </AdminSurface>

                    <AdminSurface>
                        <AdminSurfaceHeader
                            title="Workspace status"
                            description="Keep the launch state obvious."
                        />
                        <AdminSurfaceBody className="space-y-3">
                            {statusItems.map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-lg border border-slate-950/7 bg-slate-50 px-3.5 py-3"
                                >
                                    <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                        {item.label}
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-950">
                                        {item.value}
                                    </p>
                                    <p className="mt-1 text-sm leading-5 text-slate-500">
                                        {item.detail}
                                    </p>
                                </div>
                            ))}
                        </AdminSurfaceBody>
                    </AdminSurface>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <AdminSurface>
                        <AdminSurfaceHeader
                            title="Latest output"
                            description="The last meaningful thing the system produced."
                        />
                        <AdminSurfaceBody className="space-y-4">
                            <div className="rounded-lg border border-slate-950/7 bg-slate-50 px-4 py-4">
                                <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                    Latest session
                                </p>
                                <p className="mt-1 text-sm font-medium text-slate-950">
                                    {latestRun
                                        ? `Run #${latestRun.id} · ${latestRun.status}`
                                        : 'No run has been queued yet.'}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    {latestRun?.summary ??
                                        'Start from the Session page to make the live product story visible.'}
                                </p>
                                {latestRun?.requested_at ? (
                                    <p className="mt-2 text-xs text-slate-400">
                                        Requested {latestRun.requested_at}
                                    </p>
                                ) : null}
                            </div>

                            <div className="rounded-lg border border-slate-950/7 bg-white px-4 py-4">
                                <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                    Latest approved change
                                </p>
                                <p className="mt-1 text-sm font-medium text-slate-950">
                                    {latestAppliedChange
                                        ? latestAppliedChange.type.replaceAll(
                                              '_',
                                              ' ',
                                          )
                                        : 'Nothing published yet'}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    {latestAppliedChange?.rationale ??
                                        'Once a proposal is approved, this stays as the final proof point before you move to the storefront.'}
                                </p>
                            </div>
                        </AdminSurfaceBody>
                    </AdminSurface>

                    <AdminSurface>
                        <AdminSurfaceHeader
                            title="Recent activity"
                            description="A compact feed, not a dashboard."
                        />
                        <AdminSurfaceBody className="space-y-0 p-0">
                            {recentActions.length > 0 ? (
                                recentActions
                                    .slice(0, 5)
                                    .map((action, index) => (
                                        <div
                                            key={action.id}
                                            className={
                                                index === 0
                                                    ? 'px-4 py-3'
                                                    : 'border-t border-slate-950/6 px-4 py-3'
                                            }
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {action.action}
                                                </p>
                                                <span className="text-xs text-slate-400">
                                                    {action.created_at}
                                                </span>
                                            </div>
                                            {action.message ? (
                                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                                    {action.message}
                                                </p>
                                            ) : null}
                                        </div>
                                    ))
                            ) : (
                                <div className="px-4 py-8 text-sm text-slate-500">
                                    Activity will appear here after the first
                                    session or review action.
                                </div>
                            )}
                        </AdminSurfaceBody>
                    </AdminSurface>
                </div>
            </AdminPage>
        </AppLayout>
    );
}
