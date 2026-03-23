import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    Bot,
    CirclePlay,
    Search,
    ShieldCheck,
    ShieldX,
    Sparkles,
    Terminal,
    Waypoints,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
        title: 'Signals',
        href: admin.signals(),
    },
];

interface PageProps {
    auth: {
        user: {
            id: number;
        };
    };
    flash: {
        helper_token?: string | null;
        helper_name?: string | null;
    };
    [key: string]: unknown;
}

interface SignalsProps {
    filters: {
        q: string;
    };
    helper: {
        default_name: string;
        latest_device_seen_at: string | null;
    };
    latestRun: {
        id: number;
        status: string;
        summary: string | null;
        prompt: string | null;
        requested_at: string | null;
        events: Array<{
            id: number;
            action: string;
            actor_type: string;
            metadata: Record<string, unknown>;
            created_at: string;
        }>;
    } | null;
    pendingProposals: Array<{
        id: number;
        type: string;
        status: string;
        target_type: string;
        target_id: number;
        target_label: string;
        target_slug: string | null;
        rationale: string;
        confidence: number;
        payload: {
            field?: string;
            before?: string | null;
            after?: string | null;
            response_draft?: string | null;
            supporting_review_ids?: number[];
        };
    }>;
    products: Array<{
        id: number;
        name: string;
        slug: string;
    }>;
    reviews: Array<{
        id: number;
        product: string | null;
        rating: number;
        title: string | null;
        body: string;
        reviewed_at: string | null;
        sentiment: string;
        severity: string;
        response_draft: string | null;
        response_draft_status: string | null;
        tags: Array<{
            name: string | null;
            confidence: number;
        }>;
        matched_because: string[];
        match_score: number;
    }>;
    clusters: Array<{
        id: number;
        product: string | null;
        title: string;
        summary: string;
        severity: string;
        review_count: number;
        matched_because: string[];
        match_score: number;
    }>;
    recentAuditLog: Array<{
        id: number;
        action: string;
        actor_type: string;
        message: string | null;
        created_at: string;
    }>;
}

interface RunUpdatedEvent {
    id: number;
    status: string;
    summary: string | null;
    error_message: string | null;
}

interface RunEventPayload {
    id: number;
    review_analysis_run_id: number;
    actor_type: string;
    action: string;
    metadata: Record<string, unknown>;
    created_at: string;
}

export default function Signals({
    filters,
    helper,
    latestRun,
    pendingProposals,
    reviews,
    clusters,
    recentAuditLog,
}: SignalsProps) {
    const { auth, flash } = usePage<PageProps>().props;
    const [searchTerm, setSearchTerm] = useState(filters.q);
    const [helperName, setHelperName] = useState(helper.default_name);
    const [runState, setRunState] = useState(latestRun);
    const [events, setEvents] = useState(latestRun?.events ?? []);
    const helperServerUrl =
        typeof window === 'undefined'
            ? 'https://signals.test'
            : window.location.origin;

    useEffect(() => {
        setRunState(latestRun);
        setEvents(latestRun?.events ?? []);
    }, [latestRun]);

    useEcho<RunUpdatedEvent>(
        `signals.user.${auth.user.id}`,
        'review-analysis-run.updated',
        (payload) => {
            setRunState((current) =>
                current && current.id === payload.id
                    ? {
                          ...current,
                          status: payload.status,
                          summary: payload.summary,
                      }
                    : current,
            );
        },
        [auth.user.id],
    );

    useEcho<RunEventPayload>(
        `signals.user.${auth.user.id}`,
        'review-analysis-event.created',
        (payload) => {
            setEvents((current) => {
                if (
                    runState === null ||
                    payload.review_analysis_run_id !== runState.id
                ) {
                    return current;
                }

                return [
                    ...current,
                    {
                        id: payload.id,
                        action: payload.action,
                        actor_type: payload.actor_type,
                        metadata: payload.metadata,
                        created_at: payload.created_at,
                    },
                ];
            });
        },
        [auth.user.id, runState?.id],
    );

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            admin.signals().url,
            { q: searchTerm },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Signals" />
            <div className="space-y-8 p-4 md:p-6">
                <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                    <div className="rounded-[2rem] bg-[linear-gradient(135deg,_#0f172a_0%,_#1d4ed8_50%,_#38bdf8_100%)] p-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
                        <Badge className="rounded-full border-white/12 bg-white/12 px-3 py-1 text-[0.68rem] tracking-[0.24em] text-white uppercase hover:bg-white/12">
                            <Sparkles className="size-3.5" />
                            Review Intelligence
                        </Badge>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                            Search review language, surface hidden themes, and
                            kick off a local Codex run that writes proposals
                            back into the app.
                        </h1>
                        <p className="mt-4 max-w-3xl text-base leading-7 text-white/80">
                            Internal tags and complaint clusters can be written
                            automatically. Customer-facing changes still wait
                            for a human approval before they hit the storefront.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                            <Badge className="rounded-full border-white/12 bg-white/12 px-3 py-1 text-[0.68rem] tracking-[0.22em] text-white uppercase hover:bg-white/12">
                                {storeBrand.helperStack}
                            </Badge>
                            <Badge className="rounded-full border-white/12 bg-white/12 px-3 py-1 text-[0.68rem] tracking-[0.22em] text-white uppercase hover:bg-white/12">
                                {storeBrand.name}
                            </Badge>
                        </div>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button
                                type="button"
                                size="lg"
                                onClick={() =>
                                    router.post(admin.reviewRuns.store().url)
                                }
                                className="rounded-full bg-white px-6 text-slate-900 hover:bg-slate-100"
                            >
                                <CirclePlay className="size-4" />
                                Analyze New Reviews
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="rounded-full border-white/20 bg-white/8 px-6 text-white hover:bg-white/12 hover:text-white"
                            >
                                <Link href={admin.proposals.index().url}>
                                    Open Proposal Queue
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="rounded-full border-white/20 bg-white/8 px-6 text-white hover:bg-white/12 hover:text-white"
                            >
                                <Link href="/">Open Storefront</Link>
                            </Button>
                        </div>
                    </div>

                    <Card className="rounded-[2rem] border-white/80 bg-white/82 py-0 shadow-sm backdrop-blur">
                        <CardContent className="px-6 py-6">
                            <div className="flex items-center gap-2 text-sm tracking-[0.25em] text-slate-500 uppercase">
                                <Terminal className="size-4" />
                                Local Helper
                            </div>
                            <form
                                className="mt-5 space-y-4"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    router.post(admin.helperToken.store().url, {
                                        name: helperName,
                                    });
                                }}
                            >
                                <label className="block text-sm font-medium text-slate-700">
                                    Helper name
                                    <input
                                        value={helperName}
                                        onChange={(event) =>
                                            setHelperName(event.target.value)
                                        }
                                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm transition outline-none focus:border-slate-900"
                                    />
                                </label>
                                <Button
                                    type="submit"
                                    className="rounded-full bg-slate-900 hover:bg-slate-700"
                                >
                                    Issue helper token
                                </Button>
                            </form>
                            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                <p className="font-medium text-slate-900">
                                    Latest helper heartbeat
                                </p>
                                <p className="mt-1">
                                    {helper.latest_device_seen_at ??
                                        'No helper has checked in yet.'}
                                </p>
                            </div>
                            {flash.helper_token ? (
                                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                                    <p className="font-semibold">
                                        Helper token for {flash.helper_name}
                                    </p>
                                    <code className="mt-2 block overflow-x-auto rounded-xl bg-white px-3 py-3 text-xs text-slate-900">
                                        {flash.helper_token}
                                    </code>
                                    <p className="mt-4 font-semibold text-slate-900">
                                        Start the local helper
                                    </p>
                                    <code className="mt-2 block overflow-x-auto rounded-xl bg-slate-950 px-3 py-3 text-xs text-emerald-200">
                                        {`SIGNALS_SERVER_URL=${helperServerUrl} \\\nSIGNALS_DEVICE_TOKEN=${flash.helper_token} \\\nnode desktop-helper/index.mjs`}
                                    </code>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.9fr_1fr_0.95fr]">
                    <Card className="rounded-[2rem] border-white/80 bg-white/82 py-0 shadow-sm backdrop-blur">
                        <CardContent className="space-y-4 px-6 py-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Search reviews
                                </h2>
                                <Search className="size-5 text-slate-400" />
                            </div>
                            <form onSubmit={submitSearch} className="space-y-3">
                                <input
                                    value={searchTerm}
                                    onChange={(event) =>
                                        setSearchTerm(event.target.value)
                                    }
                                    placeholder="hoodie sizing, shipping delay, comfort..."
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm transition outline-none focus:border-slate-900"
                                />
                                <button
                                    type="submit"
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                                >
                                    Search
                                </button>
                            </form>
                            <div className="space-y-4">
                                {reviews.map((review) => (
                                    <article
                                        key={review.id}
                                        className="rounded-2xl bg-slate-50 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
                                            <span>{review.product}</span>
                                            <span>
                                                {review.rating}/5 · score{' '}
                                                {review.match_score}
                                            </span>
                                        </div>
                                        <h3 className="mt-3 font-semibold text-slate-900">
                                            {review.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {review.body}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900">
                                                {review.sentiment}
                                            </span>
                                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                                                severity {review.severity}
                                            </span>
                                            {review.response_draft_status ? (
                                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                                                    response{' '}
                                                    {
                                                        review.response_draft_status
                                                    }
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {review.tags.map((tag) => (
                                                <span
                                                    key={`${review.id}-${tag.name}`}
                                                    className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700"
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                        {review.response_draft ? (
                                            <div className="mt-3 rounded-2xl bg-white p-3 text-sm leading-6 text-slate-700">
                                                <p className="font-medium text-slate-900">
                                                    Saved response draft
                                                </p>
                                                <p className="mt-1">
                                                    {review.response_draft}
                                                </p>
                                            </div>
                                        ) : null}
                                        <ul className="mt-3 space-y-1 text-xs text-slate-500">
                                            {review.matched_because.map(
                                                (reason) => (
                                                    <li
                                                        key={`${review.id}-${reason}`}
                                                    >
                                                        • {reason}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </article>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Live run stream
                                </h2>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium tracking-[0.2em] text-slate-600 uppercase">
                                    {runState?.status ?? 'idle'}
                                </span>
                            </div>
                            <div className="rounded-2xl bg-slate-950 p-5 text-sm text-slate-100 shadow-inner">
                                <p className="text-xs tracking-[0.25em] text-slate-400 uppercase">
                                    Prompt
                                </p>
                                <p className="mt-2 leading-6 text-slate-200">
                                    {runState?.prompt ??
                                        'Queue a run to see the live stream populate here.'}
                                </p>
                            </div>
                            <div className="space-y-3">
                                {events.length > 0 ? (
                                    events.map((event) => (
                                        <div
                                            key={event.id}
                                            className="rounded-2xl border border-slate-200 p-4"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                                                    <Bot className="size-4 text-sky-600" />
                                                    {event.action}
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(
                                                        event.created_at,
                                                    ).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                {(event.metadata
                                                    .message as string) ??
                                                    'No message provided.'}
                                            </p>
                                            {Array.isArray(
                                                event.metadata.tool_names,
                                            ) &&
                                            event.metadata.tool_names.length >
                                                0 ? (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {(
                                                        event.metadata
                                                            .tool_names as string[]
                                                    ).map((toolName) => (
                                                        <span
                                                            key={`${event.id}-${toolName}`}
                                                            className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800"
                                                        >
                                                            {toolName}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null}
                                            {Array.isArray(
                                                event.metadata.resource_names,
                                            ) &&
                                            event.metadata.resource_names
                                                .length > 0 ? (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {(
                                                        event.metadata
                                                            .resource_names as string[]
                                                    ).map((resourceName) => (
                                                        <span
                                                            key={`${event.id}-${resourceName}`}
                                                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                                                        >
                                                            {resourceName}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null}
                                            {event.metadata.tool_name ? (
                                                <div className="mt-2 text-xs font-medium tracking-[0.2em] text-sky-700 uppercase">
                                                    Tool:{' '}
                                                    {String(
                                                        event.metadata
                                                            .tool_name,
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                                        Run events will stream here once the
                                        local helper claims a queued analysis
                                        run.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Hidden clusters
                                </h2>
                                <Waypoints className="size-5 text-slate-400" />
                            </div>
                            <div className="space-y-3">
                                {clusters.map((cluster) => (
                                    <article
                                        key={cluster.id}
                                        className="rounded-2xl bg-slate-50 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm text-slate-500">
                                                    {cluster.product}
                                                </p>
                                                <h3 className="mt-1 font-semibold text-slate-900">
                                                    {cluster.title}
                                                </h3>
                                            </div>
                                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-800">
                                                {cluster.review_count} reviews
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm leading-6 text-slate-600">
                                            {cluster.summary}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                                                severity {cluster.severity}
                                            </span>
                                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900">
                                                score {cluster.match_score}
                                            </span>
                                        </div>
                                        <ul className="mt-3 space-y-1 text-xs text-slate-500">
                                            {cluster.matched_because.map(
                                                (reason) => (
                                                    <li
                                                        key={`${cluster.id}-${reason}`}
                                                    >
                                                        • {reason}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </article>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Pending proposals
                                </h2>
                                <ShieldCheck className="size-5 text-slate-400" />
                            </div>
                            {pendingProposals.map((proposal) => {
                                const proposedBody =
                                    proposal.type === 'review_response'
                                        ? proposal.payload.response_draft
                                        : proposal.payload.after;

                                return (
                                    <article
                                        key={proposal.id}
                                        className="rounded-2xl bg-slate-50 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs tracking-[0.2em] text-slate-500 uppercase">
                                                    {proposal.type.replaceAll(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </p>
                                                <h3 className="mt-2 font-semibold text-slate-900">
                                                    {proposal.target_label}
                                                </h3>
                                            </div>
                                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                                                {(
                                                    proposal.confidence * 100
                                                ).toFixed(0)}
                                                %
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm leading-6 text-slate-600">
                                            {proposal.rationale}
                                        </p>
                                        <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                                            <p className="font-medium text-slate-900">
                                                {proposal.type ===
                                                'review_response'
                                                    ? 'Suggested response'
                                                    : 'Suggested storefront change'}
                                            </p>
                                            <p className="mt-2 leading-6">
                                                {proposedBody}
                                            </p>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-3">
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
                                                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                                            >
                                                Approve & Publish
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.post(
                                                        admin.proposals.reject({
                                                            proposal:
                                                                proposal.id,
                                                        }).url,
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                                            >
                                                <ShieldX className="size-4" />
                                                Reject
                                            </button>
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
                                                    Preview product
                                                </Link>
                                            ) : null}
                                        </div>
                                    </article>
                                );
                            })}
                            <Link
                                href={admin.proposals.index().url}
                                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                            >
                                Open full proposal queue
                            </Link>
                        </section>

                        <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Recent audit events
                                </h2>
                                <Terminal className="size-5 text-slate-400" />
                            </div>
                            <div className="space-y-3">
                                {recentAuditLog.map((event) => (
                                    <article
                                        key={event.id}
                                        className="rounded-2xl bg-slate-50 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <p className="font-medium text-slate-900">
                                                {event.action}
                                            </p>
                                            <span className="text-xs text-slate-500">
                                                {event.created_at}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {event.message ??
                                                'No message recorded.'}
                                        </p>
                                        <p className="mt-2 text-xs tracking-[0.2em] text-slate-500 uppercase">
                                            {event.actor_type}
                                        </p>
                                    </article>
                                ))}
                            </div>
                            <Link
                                href={admin.auditLog().url}
                                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                            >
                                Open full audit log
                            </Link>
                        </section>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
