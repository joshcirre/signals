import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    ArrowRight,
    Bot,
    Check,
    CirclePlay,
    Copy,
    Loader2,
    Search,
    ShieldX,
    Terminal,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useClipboard } from '@/hooks/use-clipboard';
import AppLayout from '@/layouts/app-layout';
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
    appUrl: string;
    repositoryUrl: string;
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
            review_analysis_run_id: number;
            action: string;
            actor_type: string;
            kind: string | null;
            content: string | null;
            tool_id: string | null;
            tool_name: string | null;
            item_id: string | null;
            is_error: boolean;
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
    kind: string | null;
    content: string | null;
    tool_id: string | null;
    tool_name: string | null;
    item_id: string | null;
    is_error: boolean;
    metadata: Record<string, unknown>;
    created_at: string;
}

type SignalsPageProps = Omit<SignalsProps, 'products'>;

export default function Signals({
    filters,
    helper,
    latestRun,
    pendingProposals,
    reviews,
    clusters,
    recentAuditLog,
}: SignalsPageProps) {
    return (
        <SignalsPage
            key={latestRun?.id ?? 'no-run'}
            filters={filters}
            helper={helper}
            latestRun={latestRun}
            pendingProposals={pendingProposals}
            reviews={reviews}
            clusters={clusters}
            recentAuditLog={recentAuditLog}
        />
    );
}

function SignalsPage({
    filters,
    helper,
    latestRun,
    pendingProposals,
    reviews,
    clusters,
    recentAuditLog,
}: SignalsPageProps) {
    const runUpdatedEventName = '.review-analysis-run.updated';
    const runEventCreatedEventName = '.review-analysis-event.created';
    const { appUrl, auth, flash, repositoryUrl } = usePage<PageProps>().props;
    const [searchTerm, setSearchTerm] = useState(filters.q);
    const [helperName, setHelperName] = useState(helper.default_name);
    const [runOverride, setRunOverride] = useState<RunUpdatedEvent | null>(
        null,
    );
    const [liveEvents, setLiveEvents] = useState<RunEventPayload[]>([]);
    const [copiedText, copy] = useClipboard();
    const helperServerUrl = appUrl;
    const helperRunCommand = flash.helper_token
        ? `SIGNALS_SERVER_URL=${helperServerUrl} \\\nSIGNALS_DEVICE_TOKEN=${flash.helper_token} \\\nnode desktop-helper/index.mjs`
        : 'Issue a helper token to generate the exact launch command.';
    const helperBootstrapCommand = flash.helper_token
        ? [
              'tmp_dir="${TMPDIR:-/tmp}/signals-helper"',
              'rm -rf "$tmp_dir"',
              `git clone ${repositoryUrl} "$tmp_dir"`,
              'cd "$tmp_dir"',
              'npm install --prefix desktop-helper',
              `SIGNALS_SERVER_URL=${helperServerUrl} SIGNALS_DEVICE_TOKEN=${flash.helper_token} node desktop-helper/index.mjs`,
          ].join(' && \\\n')
        : 'Generate a launch command to create a one-line helper bootstrap.';
    const needsHelperSetup = helper.latest_device_seen_at === null;
    const runState =
        latestRun !== null && runOverride?.id === latestRun.id
            ? {
                  ...latestRun,
                  status: runOverride.status,
                  summary: runOverride.summary,
              }
            : latestRun;
    const events = [...(latestRun?.events ?? []), ...liveEvents].filter(
        (event, index, allEvents) =>
            allEvents.findIndex((candidate) => candidate.id === event.id) ===
            index,
    );
    const streamEvents = events.reduce<RunEventPayload[]>((current, event) => {
        const isAssistantTextEvent =
            event.kind === 'assistant_text' ||
            event.kind === 'assistant_text_delta';

        if (!isAssistantTextEvent || event.item_id === null) {
            current.push(event);

            return current;
        }

        const existingIndex = current.findIndex(
            (candidate) =>
                candidate.item_id === event.item_id &&
                (candidate.kind === 'assistant_text' ||
                    candidate.kind === 'assistant_text_delta'),
        );

        if (existingIndex === -1) {
            current.push({
                ...event,
                kind: 'assistant_text',
            });

            return current;
        }

        const existingEvent = current[existingIndex];
        const mergedContent =
            event.kind === 'assistant_text'
                ? event.content ?? existingEvent.content
                : `${existingEvent.content ?? ''}${event.content ?? ''}`;

        current[existingIndex] = {
            ...existingEvent,
            ...event,
            kind: 'assistant_text',
            action: 'codex.message',
            content: mergedContent,
        };

        return current;
    }, []);

    useEcho<RunUpdatedEvent>(
        `signals.user.${auth.user.id}`,
        runUpdatedEventName,
        (payload) => {
            setRunOverride(payload);
        },
        [auth.user.id],
    );

    useEcho<RunEventPayload>(
        `signals.user.${auth.user.id}`,
        runEventCreatedEventName,
        (payload) => {
            setLiveEvents((current) => {
                if (
                    latestRun === null ||
                    payload.review_analysis_run_id !== latestRun.id
                ) {
                    return current;
                }

                return [
                    ...current,
                    {
                        id: payload.id,
                        review_analysis_run_id: payload.review_analysis_run_id,
                        action: payload.action,
                        actor_type: payload.actor_type,
                        kind: payload.kind,
                        content: payload.content,
                        tool_id: payload.tool_id,
                        tool_name: payload.tool_name,
                        item_id: payload.item_id,
                        is_error: payload.is_error,
                        metadata: payload.metadata,
                        created_at: payload.created_at,
                    },
                ];
            });
        },
        [auth.user.id, latestRun?.id],
    );

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            admin.signals().url,
            { q: searchTerm },
            { preserveState: true, preserveScroll: true },
        );
    };

    const eventKindLabel = (event: RunEventPayload): string => {
        if (event.kind === 'assistant_text') {
            return 'Assistant';
        }

        if (event.kind === 'tool_call') {
            return 'Tool call';
        }

        if (event.kind === 'tool_result') {
            return 'Tool result';
        }

        return 'Status';
    };

    const eventBody = (event: RunEventPayload): string =>
        event.content ??
        (typeof event.metadata.message === 'string'
            ? event.metadata.message
            : 'No message provided.');

    const EventIcon = ({ event }: { event: RunEventPayload }) => {
        if (event.is_error) {
            return (
                <ShieldX className="mt-0.5 size-4 shrink-0 text-red-500" />
            );
        }

        if (event.kind === 'assistant_text') {
            return <Bot className="mt-0.5 size-4 shrink-0 text-sky-500" />;
        }

        if (event.kind === 'tool_call') {
            return (
                <Terminal className="mt-0.5 size-4 shrink-0 text-amber-500" />
            );
        }

        if (event.kind === 'tool_result') {
            return (
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            );
        }

        return <Bot className="mt-0.5 size-4 shrink-0 text-slate-400" />;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Signals" />
            <div className="space-y-6 p-4 md:p-6">
                {/* Onboarding banner */}
                {needsHelperSetup ? (
                    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-xs font-medium text-amber-700">
                                    Setup required
                                </p>
                                <h2 className="mt-1 text-base font-semibold text-slate-900">
                                    Connect the local helper before running your
                                    first analysis.
                                </h2>
                                <p className="mt-1 max-w-[48ch] text-sm text-pretty text-slate-600">
                                    Generate a launch command below, run it in a
                                    terminal on your machine, then click Analyze
                                    New Reviews.
                                </p>
                            </div>
                            <a
                                href="#helper-setup"
                                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-950/10 py-2 pl-3 pr-2 text-sm font-medium text-slate-700 hover:bg-white"
                            >
                                Helper setup
                                <ArrowRight className="size-4 shrink-0" />
                            </a>
                        </div>
                    </section>
                ) : null}

                {/* Page header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Review Intelligence
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                            Signals
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                router.post(admin.reviewRuns.store().url)
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 py-2 pl-2 pr-3 text-sm font-medium text-white hover:bg-slate-800"
                        >
                            <CirclePlay className="size-4 shrink-0" />
                            Analyze new reviews
                        </button>
                        {latestRun ? (
                            <Link
                                href={admin.reviewRuns.show(latestRun.id).url}
                                className="rounded-lg border border-slate-950/10 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Open latest run
                            </Link>
                        ) : null}
                        <Link
                            href={admin.proposals.index().url}
                            className="rounded-lg border border-slate-950/10 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Proposals
                        </Link>
                        <Link
                            href="/"
                            className="rounded-lg border border-slate-950/10 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Storefront
                        </Link>
                    </div>
                </div>

                {/* Main 3-col grid */}
                <section className="grid gap-6 xl:grid-cols-[0.9fr_1fr_0.95fr]">
                    {/* Col 1: Search + reviews */}
                    <div className="rounded-lg border border-slate-950/10 bg-white p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-950">
                                Search reviews
                            </h2>
                            <Search className="size-4 shrink-0 text-slate-400" />
                        </div>
                        <form
                            onSubmit={submitSearch}
                            className="mt-4 space-y-3"
                        >
                            <input
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="hoodie sizing, shipping delay, comfort..."
                                className="w-full rounded-lg border border-slate-950/10 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-slate-950/20"
                            />
                            <button
                                type="submit"
                                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
                            >
                                Search
                            </button>
                        </form>
                        <div className="mt-4 space-y-3">
                            {reviews.map((review) => (
                                <article
                                    key={review.id}
                                    className="rounded-md bg-slate-50 p-4"
                                >
                                    <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
                                        <span>{review.product}</span>
                                        <span>
                                            {review.rating}/5 &middot;{' '}
                                            {review.match_score}
                                        </span>
                                    </div>
                                    {review.title ? (
                                        <h3 className="mt-2 text-sm font-semibold text-slate-900">
                                            {review.title}
                                        </h3>
                                    ) : null}
                                    <p className="mt-2 text-sm text-pretty text-slate-600">
                                        {review.body}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-xs text-sky-700">
                                            {review.sentiment}
                                        </span>
                                        <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700">
                                            severity {review.severity}
                                        </span>
                                        {review.response_draft_status ? (
                                            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700">
                                                response{' '}
                                                {review.response_draft_status}
                                            </span>
                                        ) : null}
                                    </div>
                                    {review.tags.length > 0 ? (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {review.tags.map((tag) => (
                                                <span
                                                    key={`${review.id}-${tag.name}`}
                                                    className="rounded-md bg-slate-200 px-2 py-0.5 text-xs text-slate-600"
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                    {review.response_draft ? (
                                        <div className="mt-3 rounded bg-white p-3">
                                            <p className="text-xs font-medium text-slate-700">
                                                Saved response draft
                                            </p>
                                            <p className="mt-1 text-sm text-pretty text-slate-600">
                                                {review.response_draft}
                                            </p>
                                        </div>
                                    ) : null}
                                    {review.matched_because.length > 0 ? (
                                        <ul
                                            role="list"
                                            className="mt-3 space-y-0.5 text-xs text-slate-400"
                                        >
                                            {review.matched_because.map(
                                                (reason) => (
                                                    <li
                                                        key={`${review.id}-${reason}`}
                                                    >
                                                        &middot; {reason}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    </div>

                    {/* Col 2: Live run + clusters */}
                    <div className="space-y-6">
                        <div className="rounded-lg border border-slate-950/10 bg-white p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-slate-950">
                                    Live run
                                </h2>
                                <span
                                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                                        runState?.status === 'running'
                                            ? 'animate-pulse bg-violet-500/10 text-violet-600'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    {runState?.status ?? 'idle'}
                                </span>
                            </div>
                            {runState?.prompt ? (
                                <div className="mt-4 rounded-md bg-slate-50 px-4 py-3">
                                    <p className="text-xs font-medium text-slate-500">
                                        Prompt
                                    </p>
                                    <p className="mt-1 text-sm text-pretty text-slate-700">
                                        {runState.prompt}
                                    </p>
                                </div>
                            ) : null}
                            <div className="mt-4 space-y-2">
                                {streamEvents.length > 0 ? (
                                    streamEvents.map((event, index) => {
                                        const isLive =
                                            runState?.status === 'running' &&
                                            index ===
                                                streamEvents.length - 1;

                                        return (
                                            <div
                                                key={event.id}
                                                className={`flex items-start gap-3 rounded-md border px-3 py-2.5 ${
                                                    event.is_error
                                                        ? 'border-red-200 bg-red-50/60'
                                                        : 'border-slate-950/5 bg-slate-50'
                                                }`}
                                            >
                                                {isLive ? (
                                                    <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-violet-500" />
                                                ) : (
                                                    <EventIcon event={event} />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <p className="text-sm font-medium text-slate-900">
                                                            {eventKindLabel(
                                                                event,
                                                            )}
                                                        </p>
                                                        <time className="shrink-0 text-xs text-slate-400">
                                                            {new Date(
                                                                event.created_at,
                                                            ).toLocaleTimeString()}
                                                        </time>
                                                    </div>
                                                    <p
                                                        className={`mt-1 text-xs text-pretty ${
                                                            event.kind ===
                                                            'assistant_text'
                                                                ? 'whitespace-pre-wrap text-slate-700'
                                                                : event.is_error
                                                                  ? 'text-red-700'
                                                                  : 'text-slate-500'
                                                        }`}
                                                    >
                                                        {eventBody(event)}
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                                                            {event.action}
                                                        </span>
                                                        {event.tool_name ? (
                                                            <span
                                                                className={`rounded-md px-2 py-0.5 text-xs ${
                                                                    event.is_error
                                                                        ? 'bg-red-100 text-red-700'
                                                                        : event.kind ===
                                                                            'tool_call'
                                                                          ? 'bg-amber-500/10 text-amber-700'
                                                                          : 'bg-emerald-500/10 text-emerald-700'
                                                                }`}
                                                            >
                                                                {event.tool_name}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    {Array.isArray(
                                                        event.metadata
                                                            .tool_names,
                                                    ) &&
                                                    event.metadata.tool_names
                                                        .length > 0 ? (
                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                            {(
                                                                event.metadata
                                                                    .tool_names as string[]
                                                            ).map(
                                                                (toolName) => (
                                                                    <span
                                                                        key={`${event.id}-${toolName}`}
                                                                        className="rounded-md bg-violet-500/10 px-2 py-0.5 text-xs text-violet-600"
                                                                    >
                                                                        {
                                                                            toolName
                                                                        }
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    ) : null}
                                                    {Array.isArray(
                                                        event.metadata
                                                            .resource_names,
                                                    ) &&
                                                    event.metadata
                                                        .resource_names
                                                        .length > 0 ? (
                                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                            {(
                                                                event.metadata
                                                                    .resource_names as string[]
                                                            ).map(
                                                                (
                                                                    resourceName,
                                                                ) => (
                                                                    <span
                                                                        key={`${event.id}-${resourceName}`}
                                                                        className="rounded-md bg-slate-200 px-2 py-0.5 text-xs text-slate-600"
                                                                    >
                                                                        {
                                                                            resourceName
                                                                        }
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="rounded-md border border-dashed border-slate-950/10 p-6 text-sm text-slate-400">
                                        Run events will stream here once the
                                        local helper claims a queued run.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Clusters */}
                        <div className="rounded-lg border border-slate-950/10 bg-white p-6">
                            <h2 className="text-sm font-semibold text-slate-950">
                                Complaint clusters
                            </h2>
                            <div className="mt-4 space-y-3">
                                {clusters.map((cluster) => (
                                    <article
                                        key={cluster.id}
                                        className="rounded-md bg-slate-50 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                {cluster.product ? (
                                                    <p className="text-xs text-slate-500">
                                                        {cluster.product}
                                                    </p>
                                                ) : null}
                                                <h3 className="mt-1 text-sm font-semibold text-slate-900">
                                                    {cluster.title}
                                                </h3>
                                            </div>
                                            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                                {cluster.review_count} reviews
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-pretty text-slate-600">
                                            {cluster.summary}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700">
                                                severity {cluster.severity}
                                            </span>
                                            <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-xs text-sky-700">
                                                score {cluster.match_score}
                                            </span>
                                        </div>
                                        {cluster.matched_because.length > 0 ? (
                                            <ul
                                                role="list"
                                                className="mt-2 space-y-0.5 text-xs text-slate-400"
                                            >
                                                {cluster.matched_because.map(
                                                    (reason) => (
                                                        <li
                                                            key={`${cluster.id}-${reason}`}
                                                        >
                                                            &middot; {reason}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        ) : null}
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Col 3: Proposals + helper setup + audit log */}
                    <div className="space-y-6">
                        {/* Pending proposals */}
                        <div className="rounded-lg border border-slate-950/10 bg-white p-6">
                            <h2 className="text-sm font-semibold text-slate-950">
                                Pending proposals
                            </h2>
                            <div className="mt-4 space-y-4">
                                {pendingProposals.map((proposal) => {
                                    const proposedBody =
                                        proposal.type === 'review_response'
                                            ? proposal.payload.response_draft
                                            : proposal.payload.after;

                                    return (
                                        <article
                                            key={proposal.id}
                                            className="rounded-md bg-slate-50 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-xs text-slate-500">
                                                        {proposal.type.replaceAll(
                                                            '_',
                                                            ' ',
                                                        )}
                                                    </p>
                                                    <h3 className="mt-1 text-sm font-semibold text-slate-900">
                                                        {proposal.target_label}
                                                    </h3>
                                                </div>
                                                <span className="shrink-0 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700">
                                                    {(
                                                        proposal.confidence *
                                                        100
                                                    ).toFixed(0)}
                                                    %
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm text-pretty text-slate-600">
                                                {proposal.rationale}
                                            </p>
                                            {proposedBody ? (
                                                <div className="mt-3 rounded bg-white p-3">
                                                    <p className="text-xs font-medium text-slate-500">
                                                        {proposal.type ===
                                                        'review_response'
                                                            ? 'Suggested response'
                                                            : 'Suggested change'}
                                                    </p>
                                                    <p className="mt-1 text-sm text-pretty text-slate-700">
                                                        {proposedBody}
                                                    </p>
                                                </div>
                                            ) : null}
                                            <div className="mt-3 flex flex-wrap gap-2">
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
                                                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-200"
                                                >
                                                    Approve & publish
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
                                                    <ShieldX className="size-3 shrink-0" />
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
                                                        className="rounded-lg border border-slate-950/10 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-950/30"
                                                    >
                                                        Preview
                                                    </Link>
                                                ) : null}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                            <Link
                                href={admin.proposals.index().url}
                                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-950"
                            >
                                Open proposal queue
                            </Link>
                        </div>

                        {/* Local helper setup */}
                        <div
                            id="helper-setup"
                            className="rounded-lg border border-slate-950/10 bg-white p-6"
                        >
                            <div className="flex items-center gap-2">
                                <Terminal className="size-4 shrink-0 text-slate-400" />
                                <h2 className="text-sm font-semibold text-slate-950">
                                    Local helper
                                </h2>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                Heartbeat:{' '}
                                {helper.latest_device_seen_at ??
                                    'No check-in yet'}
                            </p>
                            <form
                                className="mt-4 space-y-3"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    router.post(
                                        admin.helperToken.store().url,
                                        { name: helperName },
                                    );
                                }}
                            >
                                <label className="block text-sm font-medium text-slate-700">
                                    Helper name
                                    <input
                                        value={helperName}
                                        onChange={(event) =>
                                            setHelperName(event.target.value)
                                        }
                                        className="mt-2 w-full rounded-lg border border-slate-950/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-950/20"
                                    />
                                </label>
                                <button
                                    type="submit"
                                    className="rounded-lg border border-slate-950/10 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Generate command
                                </button>
                            </form>
                            {flash.helper_token ? (
                                <div className="mt-4 space-y-3">
                                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-medium text-emerald-900">
                                                Launch command for{' '}
                                                {flash.helper_name}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void copy(
                                                        helperBootstrapCommand,
                                                    )
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-white py-1 pl-1 pr-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                {copiedText ===
                                                helperBootstrapCommand ? (
                                                    <Check className="size-3 shrink-0" />
                                                ) : (
                                                    <Copy className="size-3 shrink-0" />
                                                )}
                                                Copy
                                            </button>
                                        </div>
                                        <code className="mt-3 block overflow-x-auto rounded-md bg-slate-950 px-3 py-3 text-xs text-emerald-200">
                                            {helperBootstrapCommand}
                                        </code>
                                    </div>
                                    <div className="rounded-md border border-slate-950/5 bg-slate-50 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-xs font-medium text-slate-600">
                                                Rerun-only command
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void copy(helperRunCommand)
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-950/10 bg-white py-1 pl-1 pr-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                            >
                                                {copiedText ===
                                                helperRunCommand ? (
                                                    <Check className="size-3 shrink-0" />
                                                ) : (
                                                    <Copy className="size-3 shrink-0" />
                                                )}
                                                Copy
                                            </button>
                                        </div>
                                        <code className="mt-2 block overflow-x-auto rounded-md bg-slate-950 px-3 py-2 text-xs text-slate-300">
                                            {helperRunCommand}
                                        </code>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 rounded-md bg-slate-50 px-4 py-3 text-xs text-slate-500">
                                    Generate a command to launch the local
                                    helper on your machine.
                                </div>
                            )}
                        </div>

                        {/* Audit log */}
                        <div className="rounded-lg border border-slate-950/10 bg-white p-6">
                            <h2 className="text-sm font-semibold text-slate-950">
                                Recent audit events
                            </h2>
                            <div className="mt-4 divide-y divide-slate-950/5">
                                {recentAuditLog.map((entry) => (
                                    <div key={entry.id} className="py-3">
                                        <div className="flex items-center justify-between gap-4">
                                            <p className="text-sm font-medium text-slate-900">
                                                {entry.action}
                                            </p>
                                            <time className="shrink-0 text-xs text-slate-400">
                                                {entry.created_at}
                                            </time>
                                        </div>
                                        {entry.message ? (
                                            <p className="mt-1 text-xs text-pretty text-slate-500">
                                                {entry.message}
                                            </p>
                                        ) : null}
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            {entry.actor_type}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <Link
                                href={admin.auditLog().url}
                                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-950"
                            >
                                Open audit log
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
