import { Head, Link } from '@inertiajs/react';
import { CirclePlay, ClipboardList, Radar, ShoppingBag } from 'lucide-react';
import {
    AdminHeader,
    AdminPage,
    AdminPill,
    AdminSurface,
    AdminSurfaceBody,
} from '@/components/admin-page';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';

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
                    title="Start"
                    meta={
                        <>
                            <AdminPill>
                                <span
                                    className={`size-1.5 rounded-full ${onboarding.needs_helper_setup ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                />
                                {onboarding.needs_helper_setup
                                    ? 'Helper offline'
                                    : 'Helper ready'}
                            </AdminPill>
                            {stats.pending_proposals > 0 ? (
                                <AdminPill>
                                    <span className="size-1.5 rounded-full bg-slate-300" />
                                    {stats.pending_proposals} pending
                                </AdminPill>
                            ) : null}
                        </>
                    }
                />

                <AdminSurface>
                    <AdminSurfaceBody className="space-y-6 p-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href={nextStep.href}
                                className="inline-flex items-center gap-2 rounded-sm bg-slate-950 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                            >
                                <CirclePlay className="size-4" />
                                {nextStep.label}
                            </Link>
                            <span className="text-sm text-slate-500">
                                {nextStep.title}
                            </span>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            {flowSteps.map((step) => (
                                <Link
                                    key={step.label}
                                    href={step.href}
                                    className="group rounded-sm border border-slate-950/8 bg-slate-50 px-4 py-4 transition hover:border-slate-950/20 hover:bg-white"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-semibold tracking-[0.16em] text-slate-400">
                                            {step.label}
                                        </span>
                                        <step.icon className="size-4 text-slate-400" />
                                    </div>
                                    <p className="mt-3 text-sm font-medium text-slate-950">
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
            </AdminPage>
        </AppLayout>
    );
}
