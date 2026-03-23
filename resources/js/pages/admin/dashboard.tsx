import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    ClipboardList,
    MessageSquareWarning,
    Search,
    ShoppingBag,
    type LucideIcon,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { storeBrand } from '@/lib/brand';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
import { FormEvent, useState } from 'react';
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
    const [searchTerm, setSearchTerm] = useState('hoodie reviews about sizing');
    const cards: StatCard[] = [
        { label: 'Products', value: stats.products, icon: ShoppingBag },
        { label: 'Awaiting analysis', value: stats.new_reviews, icon: Search },
        {
            label: 'Low-rating reviews',
            value: stats.negative_reviews,
            icon: MessageSquareWarning,
        },
        {
            label: 'Pending proposals',
            value: stats.pending_proposals,
            icon: ClipboardList,
        },
    ];

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();

        router.get(admin.signals().url, { q: searchTerm });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="space-y-8 p-4 md:p-6">
                <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-[2.2rem] bg-[linear-gradient(135deg,_#112031_0%,_#1b3f74_48%,_#38bdf8_100%)] p-8 text-white shadow-[0_28px_85px_rgba(17,32,49,0.28)]">
                        <Badge className="rounded-full border-white/12 bg-white/12 px-3 py-1 text-[0.68rem] tracking-[0.24em] text-white uppercase hover:bg-white/12">
                            {storeBrand.adminName}
                        </Badge>
                        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight">
                            Customer language becomes shopper guidance after one
                            visible approval step.
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-white/78">
                            Northstar uses a local Codex helper, Laravel MCP
                            tools, and a lightweight approval layer to turn
                            recurring review friction into safer storefront copy
                            changes.
                        </p>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <Button
                                asChild
                                size="lg"
                                className="rounded-full bg-white px-6 text-slate-950 hover:bg-slate-100"
                            >
                                <Link href={admin.signals().url}>
                                    Open Signals
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="rounded-full border-white/22 bg-white/8 px-6 text-white hover:bg-white/12 hover:text-white"
                            >
                                <Link href={admin.proposals.index().url}>
                                    Open Proposal Queue
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="rounded-full border-white/22 bg-white/8 px-6 text-white hover:bg-white/12 hover:text-white"
                            >
                                <Link href="/">View Storefront</Link>
                            </Button>
                        </div>
                    </div>

                    <Card className="rounded-[2rem] border-white/80 bg-white/82 py-0 shadow-[0_20px_60px_rgba(15,23,42,0.1)] backdrop-blur">
                        <CardContent className="space-y-5 px-6 py-6">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium tracking-[0.24em] text-slate-500 uppercase">
                                        Demo focus
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                                        Signals control room
                                    </h2>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-800"
                                >
                                    Hosted + local
                                </Badge>
                            </div>
                            <div className="grid gap-3 text-sm text-slate-700">
                                <div className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                                    1. Search reviews using natural merchant
                                    language.
                                </div>
                                <div className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                                    2. Watch Codex stream MCP tool usage back
                                    into the admin UI.
                                </div>
                                <div className="rounded-[1.4rem] bg-amber-50 px-4 py-4 text-amber-950">
                                    3. Approve one fit-note proposal and refresh
                                    the public storefront.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {cards.map(({ label, value, icon: Icon }) => (
                        <Card
                            key={label}
                            className="rounded-[1.75rem] border-white/80 bg-white/82 py-0 shadow-sm backdrop-blur"
                        >
                            <CardContent className="px-5 py-5">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-500">
                                        {label}
                                    </p>
                                    <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
                                        <Icon className="size-4" />
                                    </div>
                                </div>
                                <p className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">
                                    {value}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                    <div className="rounded-[2rem] border border-white/40 bg-[linear-gradient(135deg,_rgba(255,255,255,0.55)_0%,_rgba(255,255,255,0.84)_100%)] p-7 text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
                        <div className="flex items-center gap-2 text-sm tracking-[0.25em] text-slate-500 uppercase">
                            <Activity className="size-4" />
                            Signals
                        </div>
                        <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                            Stream live Codex analysis, inspect proposals, and
                            push storefront updates with approval.
                        </h2>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                            The primary demo loop lives in Signals. Search
                            reviews semantically, watch the local helper claim a
                            run, and approve the best proposal for immediate
                            storefront impact.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button
                                asChild
                                className="rounded-full bg-slate-950 hover:bg-slate-800"
                            >
                                <Link href={admin.signals().url}>
                                    Open Signals
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="rounded-full"
                            >
                                <Link href={admin.auditLog().url}>
                                    Open Audit Log
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="rounded-full"
                            >
                                <Link href={admin.proposals.index().url}>
                                    Open Proposal Queue
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <Card className="rounded-[2rem] border-white/80 bg-white/82 py-0 shadow-sm backdrop-blur">
                        <CardContent className="px-6 py-6">
                            <p className="text-sm font-medium tracking-[0.25em] text-slate-500 uppercase">
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
                                    No review analysis runs have been queued
                                    yet.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <Card className="rounded-[2rem] border-white/80 bg-white/82 py-0 shadow-sm backdrop-blur">
                    <CardContent className="px-6 py-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm tracking-[0.25em] text-slate-500 uppercase">
                                    Quick search
                                </p>
                                <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                                    Jump straight into the trust-building
                                    retrieval demo.
                                </h2>
                            </div>
                            <Search className="size-5 text-slate-400" />
                        </div>
                        <form
                            onSubmit={submitSearch}
                            className="mt-5 flex flex-col gap-3 md:flex-row"
                        >
                            <input
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm transition outline-none focus:border-slate-900"
                            />
                            <button
                                type="submit"
                                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                            >
                                Open in Signals
                            </button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-white/80 bg-white/82 py-0 shadow-sm backdrop-blur">
                    <CardContent className="px-6 py-6">
                        {latestAppliedChange ? (
                            <div className="mb-6 rounded-[1.5rem] bg-slate-50 p-5">
                                <p className="text-sm font-medium tracking-[0.25em] text-slate-500 uppercase">
                                    Latest Approved Change
                                </p>
                                <p className="mt-3 text-lg font-semibold text-slate-900">
                                    {latestAppliedChange.type.replaceAll(
                                        '_',
                                        ' ',
                                    )}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {latestAppliedChange.rationale}
                                </p>
                                <p className="mt-3 text-sm text-slate-500">
                                    {latestAppliedChange.applied_at ??
                                        'Awaiting publication timestamp'}
                                </p>
                            </div>
                        ) : null}
                        <h2 className="text-xl font-semibold text-slate-900">
                            Recent actions
                        </h2>
                        <div className="mt-5 space-y-4">
                            {recentActions.map((action) => (
                                <div
                                    key={action.id}
                                    className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
                                >
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {action.action}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {action.message}
                                        </p>
                                    </div>
                                    <div className="text-sm text-slate-500">
                                        {action.actor_type} ·{' '}
                                        {action.created_at}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
