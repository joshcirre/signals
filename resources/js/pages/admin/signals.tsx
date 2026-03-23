import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    Bot,
    Check,
    CirclePlay,
    Copy,
    Loader2,
    Radar,
    Search,
    ShieldX,
    Terminal,
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
import { useClipboard } from '@/hooks/use-clipboard';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
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
        latest_device_seen_at_human: string | null;
    };
    latestRun: {
        id: number;
        status: string;
        kind: string;
        summary: string | null;
        prompt: string | null;
        context: Record<string, unknown> | null;
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

interface HelperHeartbeatUpdatedEvent {
    id: number;
    name: string;
    last_seen_at: string | null;
    last_seen_at_human: string | null;
    is_active: boolean;
}

type SignalsPageProps = Omit<SignalsProps, 'products'>;

function eventKindLabel(event: RunEventPayload): string {
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
}

function eventBody(event: RunEventPayload): string {
    return (
        event.content ??
        (typeof event.metadata.message === 'string'
            ? event.metadata.message
            : 'No message provided.')
    );
}

function runStatusClassName(status: string | null | undefined): string {
    if (status === 'running') {
        return 'border-sky-200 bg-sky-50 text-sky-700';
    }

    if (status === 'completed') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (status === 'failed') {
        return 'border-red-200 bg-red-50 text-red-700';
    }

    return 'border-slate-200 bg-slate-50 text-slate-500';
}

function runKindLabel(kind: string | null | undefined): string {
    if (kind === 'storefront_adaptation') {
        return 'Storefront adaptation';
    }

    return 'Review analysis';
}

function proposalFieldLabel(field: string | null | undefined): string {
    if (!field) {
        return 'Storefront copy';
    }

    return field.replaceAll('_', ' ');
}

function StreamEventIcon({
    event,
    isLive,
}: {
    event: RunEventPayload;
    isLive: boolean;
}) {
    if (isLive) {
        return <Loader2 className="size-4 animate-spin text-sky-500" />;
    }

    if (event.is_error) {
        return <ShieldX className="size-4 text-red-500" />;
    }

    if (event.kind === 'assistant_text') {
        return <Bot className="size-4 text-sky-500" />;
    }

    if (event.kind === 'tool_call') {
        return <Terminal className="size-4 text-amber-500" />;
    }

    if (event.kind === 'tool_result') {
        return <Check className="size-4 text-emerald-500" />;
    }

    return <Radar className="size-4 text-slate-400" />;
}

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
    const helperHeartbeatEventName = '.signals-helper.heartbeat.updated';
    const runUpdatedEventName = '.review-analysis-run.updated';
    const runEventCreatedEventName = '.review-analysis-event.created';
    const { appUrl, auth, flash, repositoryUrl } = usePage<PageProps>().props;
    const [searchTerm, setSearchTerm] = useState(filters.q);
    const [helperLastSeenAt, setHelperLastSeenAt] = useState(
        helper.latest_device_seen_at,
    );
    const [helperLastSeenAtHuman, setHelperLastSeenAtHuman] = useState(
        helper.latest_device_seen_at_human,
    );
    const [runOverride, setRunOverride] = useState<RunUpdatedEvent | null>(
        null,
    );
    const [liveEvents, setLiveEvents] = useState<RunEventPayload[]>([]);
    const [copiedText, copy] = useClipboard();
    const helperServerUrl = appUrl;
    const helperRunCommand = flash.helper_token
        ? `SIGNALS_SERVER_URL=${helperServerUrl} \\\nSIGNALS_DEVICE_TOKEN=${flash.helper_token} \\\nnode desktop-helper/index.mjs`
        : 'Helper token unavailable.';
    const helperBootstrapCommand = flash.helper_token
        ? [
              'tmp_dir="${TMPDIR:-/tmp}/signals-helper"',
              'rm -rf "$tmp_dir"',
              `git clone ${repositoryUrl} "$tmp_dir"`,
              'cd "$tmp_dir"',
              'npm install --prefix desktop-helper',
              `SIGNALS_SERVER_URL=${helperServerUrl} SIGNALS_DEVICE_TOKEN=${flash.helper_token} node desktop-helper/index.mjs`,
          ].join(' && \\\n')
        : 'Helper token unavailable.';
    const needsHelperSetup = helperLastSeenAt === null;
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
                ? (event.content ?? existingEvent.content)
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

    useEcho<HelperHeartbeatUpdatedEvent>(
        `signals.user.${auth.user.id}`,
        helperHeartbeatEventName,
        (payload) => {
            setHelperLastSeenAt(payload.last_seen_at);
            setHelperLastSeenAtHuman(payload.last_seen_at_human);
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Signals" />

            <AdminPage>
                <AdminHeader
                    eyebrow="Review intelligence"
                    title="Signals"
                    description="The admin demo should read in one direction: search the review signal, run the analysis, then approve the resulting proposal. This layout keeps those stages visible without the oversized card stack."
                    meta={
                        <>
                            <AdminPill
                                className={runStatusClassName(runState?.status)}
                            >
                                {runState?.status ?? 'idle'}
                            </AdminPill>
                            <AdminPill>
                                <span className="size-1.5 rounded-full bg-slate-300" />
                                {needsHelperSetup
                                    ? 'Helper offline'
                                    : 'Helper connected'}
                            </AdminPill>
                        </>
                    }
                    actions={
                        <>
                            <button
                                type="button"
                                onClick={() =>
                                    router.post(admin.reviewRuns.store().url, {
                                        kind: 'review_analysis',
                                    })
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                            >
                                <CirclePlay className="size-4" />
                                Analyze new reviews
                            </button>
                            {latestRun ? (
                                <Link
                                    href={
                                        admin.reviewRuns.show(latestRun.id).url
                                    }
                                    className="rounded-lg border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                                >
                                    Open latest run
                                </Link>
                            ) : null}
                            <Link
                                href={admin.proposals.index().url}
                                className="rounded-lg border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                            >
                                Proposals
                            </Link>
                        </>
                    }
                />

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_360px]">
                    <AdminSurface>
                        <AdminSurfaceBody className="space-y-4 p-5">
                            <div className="space-y-2">
                                <p className="text-[11px] font-medium tracking-[0.22em] text-slate-400 uppercase">
                                    Start here
                                </p>
                                <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                                    Search the review signal you want to demo.
                                </h2>
                                <p className="max-w-3xl text-sm leading-6 text-slate-600">
                                    Use a natural-language query to pull in the
                                    reviews and complaint clusters that matter,
                                    then queue a run when the helper is online.
                                </p>
                            </div>

                            <form
                                onSubmit={submitSearch}
                                className="rounded-lg border border-slate-950/8 bg-slate-50/80 p-3"
                            >
                                <div className="flex flex-col gap-3 lg:flex-row">
                                    <div className="min-w-0 flex-1">
                                        <label
                                            htmlFor="signals-search"
                                            className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase"
                                        >
                                            Query
                                        </label>
                                        <input
                                            id="signals-search"
                                            value={searchTerm}
                                            onChange={(event) =>
                                                setSearchTerm(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="hoodie sizing, shipping delay, comfort..."
                                            className="mt-2 w-full rounded-lg border border-slate-950/10 bg-white px-3 py-2.5 text-sm text-slate-900 transition outline-none focus:border-slate-950/20 focus:ring-2 focus:ring-slate-950/5"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-slate-900 ring-1 ring-slate-950/10 transition hover:bg-slate-100"
                                    >
                                        <Search className="size-4" />
                                        Search reviews
                                    </button>
                                </div>
                            </form>

                            <div className="grid gap-3 md:grid-cols-3">
                                <AdminMetric
                                    label="Matched reviews"
                                    value={reviews.length}
                                    detail="Results for the active query."
                                />
                                <AdminMetric
                                    label="Complaint clusters"
                                    value={clusters.length}
                                    detail="Grouped pain points worth checking."
                                />
                                <AdminMetric
                                    label="Pending proposals"
                                    value={pendingProposals.length}
                                    detail="Ready for operator review."
                                />
                            </div>
                        </AdminSurfaceBody>
                    </AdminSurface>

                    <AdminSurface>
                        <AdminSurfaceHeader
                            title="Next action"
                            description={
                                needsHelperSetup
                                    ? 'Start the helper with the command below. The page will switch to ready as soon as it checks in over Echo.'
                                    : pendingProposals.length > 0
                                      ? 'Review the proposals created from the last run.'
                                      : 'Queue a new run once your query looks right.'
                            }
                        />
                        <AdminSurfaceBody className="space-y-3">
                            {needsHelperSetup ? (
                                <>
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                                        Run the helper bootstrap command. As
                                        soon as the helper starts polling, this
                                        panel will update to connected
                                        automatically.
                                    </div>
                                    <div className="rounded-lg border border-slate-950/8 bg-slate-950 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                    Bootstrap command
                                                </p>
                                                <p className="mt-1 text-sm text-slate-200">
                                                    Starts the helper with the
                                                    current Signals token.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void copy(
                                                        helperBootstrapCommand,
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-slate-800"
                                            >
                                                {copiedText ===
                                                helperBootstrapCommand ? (
                                                    <Check className="size-3.5" />
                                                ) : (
                                                    <Copy className="size-3.5" />
                                                )}
                                                Copy
                                            </button>
                                        </div>
                                        <code className="mt-3 block overflow-x-auto text-xs leading-5 break-all whitespace-pre-wrap text-emerald-200">
                                            {helperBootstrapCommand}
                                        </code>
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                                    The helper last checked in{' '}
                                    <span title={helperLastSeenAt ?? undefined}>
                                        {helperLastSeenAtHuman}
                                    </span>
                                    .
                                </div>
                            )}

                            {runState ? (
                                <div className="rounded-lg border border-slate-950/8 bg-slate-50/80 px-4 py-3">
                                    <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                        Latest run
                                    </p>
                                    <p className="mt-2 text-sm font-medium text-slate-950">
                                        {runState.summary ??
                                            'Run ready to inspect.'}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        {runKindLabel(runState.kind)} ·{' '}
                                        Requested {runState.requested_at}
                                    </p>
                                </div>
                            ) : null}

                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href={admin.proposals.index().url}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                                >
                                    Open proposal queue
                                </Link>
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                                >
                                    View storefront
                                </Link>
                            </div>
                        </AdminSurfaceBody>
                    </AdminSurface>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                    <AdminSurface>
                        <AdminSurfaceHeader
                            title="Live run"
                            description="Assistant messages, tool calls, and system updates stream into one compact feed."
                            action={
                                <AdminPill
                                    className={runStatusClassName(
                                        runState?.status,
                                    )}
                                >
                                    {runState?.status ?? 'idle'}
                                </AdminPill>
                            }
                        />
                        <AdminSurfaceBody className="space-y-4">
                            {runState?.prompt ? (
                                <div className="rounded-lg border border-slate-950/8 bg-slate-50/80 px-4 py-3">
                                    <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                        Prompt
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-slate-700">
                                        {runState.prompt}
                                    </p>
                                </div>
                            ) : null}

                            {streamEvents.length > 0 ? (
                                <div className="max-h-[38rem] space-y-2 overflow-y-auto pr-1">
                                    {streamEvents.map((event, index) => {
                                        const isLive =
                                            runState?.status === 'running' &&
                                            index === streamEvents.length - 1;

                                        return (
                                            <div
                                                key={event.id}
                                                className={cn(
                                                    'rounded-lg border px-3 py-3',
                                                    event.is_error
                                                        ? 'border-red-200 bg-red-50/70'
                                                        : 'border-slate-950/8 bg-slate-50/80',
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-950/8 bg-white">
                                                        <StreamEventIcon
                                                            event={event}
                                                            isLive={isLive}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <p className="text-sm font-medium text-slate-900">
                                                                {eventKindLabel(
                                                                    event,
                                                                )}
                                                            </p>
                                                            <time className="text-xs text-slate-400">
                                                                {new Date(
                                                                    event.created_at,
                                                                ).toLocaleTimeString()}
                                                            </time>
                                                        </div>
                                                        <p
                                                            className={cn(
                                                                'mt-1 text-sm leading-6',
                                                                event.is_error
                                                                    ? 'text-red-700'
                                                                    : event.kind ===
                                                                        'assistant_text'
                                                                      ? 'whitespace-pre-wrap text-slate-700'
                                                                      : 'text-slate-600',
                                                            )}
                                                        >
                                                            {eventBody(event)}
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium tracking-[0.16em] text-slate-500 uppercase ring-1 ring-slate-950/8">
                                                                {event.action}
                                                            </span>
                                                            {event.tool_name ? (
                                                                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium tracking-[0.16em] text-slate-500 uppercase ring-1 ring-slate-950/8">
                                                                    {
                                                                        event.tool_name
                                                                    }
                                                                </span>
                                                            ) : null}
                                                            {Array.isArray(
                                                                event.metadata
                                                                    .tool_names,
                                                            )
                                                                ? (
                                                                      event
                                                                          .metadata
                                                                          .tool_names as string[]
                                                                  ).map(
                                                                      (
                                                                          toolName,
                                                                      ) => (
                                                                          <span
                                                                              key={`${event.id}-${toolName}`}
                                                                              className="rounded-full bg-sky-50 px-2 py-1 text-[11px] font-medium tracking-[0.16em] text-sky-700 uppercase"
                                                                          >
                                                                              {
                                                                                  toolName
                                                                              }
                                                                          </span>
                                                                      ),
                                                                  )
                                                                : null}
                                                            {Array.isArray(
                                                                event.metadata
                                                                    .resource_names,
                                                            )
                                                                ? (
                                                                      event
                                                                          .metadata
                                                                          .resource_names as string[]
                                                                  ).map(
                                                                      (
                                                                          resourceName,
                                                                      ) => (
                                                                          <span
                                                                              key={`${event.id}-${resourceName}`}
                                                                              className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-medium tracking-[0.16em] text-slate-600 uppercase"
                                                                          >
                                                                              {
                                                                                  resourceName
                                                                              }
                                                                          </span>
                                                                      ),
                                                                  )
                                                                : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed border-slate-950/8 px-4 py-8 text-sm leading-6 text-slate-500">
                                    Run events will appear here once the local
                                    helper claims a queued run.
                                </div>
                            )}
                        </AdminSurfaceBody>
                    </AdminSurface>

                    <AdminSurface>
                        <AdminSurfaceHeader
                            title="Pending proposals"
                            description="The next storefront changes waiting for review."
                            action={
                                <Link
                                    href={admin.proposals.index().url}
                                    className="text-sm font-medium text-slate-500 transition hover:text-slate-950"
                                >
                                    Open queue
                                </Link>
                            }
                        />
                        <AdminSurfaceBody className="space-y-3">
                            {pendingProposals.length > 0 ? (
                                pendingProposals.map((proposal) => {
                                    const proposedBody =
                                        proposal.type === 'review_response'
                                            ? proposal.payload.response_draft
                                            : proposal.payload.after;

                                    return (
                                        <article
                                            key={proposal.id}
                                            className="rounded-lg border border-slate-950/8 bg-slate-50/80 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                        {proposal.type.replaceAll(
                                                            '_',
                                                            ' ',
                                                        )}
                                                    </p>
                                                    <h3 className="mt-1 text-sm font-medium text-slate-950">
                                                        {proposal.target_label}
                                                    </h3>
                                                    {proposal.type ===
                                                    'product_copy_change' ? (
                                                        <p className="mt-1 text-xs text-slate-400">
                                                            {proposalFieldLabel(
                                                                proposal.payload
                                                                    .field,
                                                            )}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                                                    {(
                                                        proposal.confidence *
                                                        100
                                                    ).toFixed(0)}
                                                    %
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                {proposal.rationale}
                                            </p>
                                            {proposedBody ? (
                                                <div className="mt-3 rounded-lg border border-slate-950/8 bg-white px-3 py-3">
                                                    <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                        {proposal.type ===
                                                        'review_response'
                                                            ? 'Suggested response'
                                                            : 'Suggested change'}
                                                    </p>
                                                    <p className="mt-2 text-sm leading-6 text-slate-700">
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
                                                    className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                                                >
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
                                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-950/20 hover:bg-slate-50"
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
                                                        className="rounded-lg border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-950/20 hover:bg-slate-50"
                                                    >
                                                        Preview
                                                    </Link>
                                                ) : null}
                                                {proposal.type ===
                                                    'product_copy_change' &&
                                                proposal.target_slug ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            router.post(
                                                                admin.reviewRuns.store()
                                                                    .url,
                                                                {
                                                                    kind: 'storefront_adaptation',
                                                                    proposal_id:
                                                                        proposal.id,
                                                                },
                                                            )
                                                        }
                                                        className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
                                                    >
                                                        Launch storefront
                                                        adaptation
                                                    </button>
                                                ) : null}
                                            </div>
                                        </article>
                                    );
                                })
                            ) : (
                                <div className="rounded-lg border border-dashed border-slate-950/8 px-4 py-8 text-sm leading-6 text-slate-500">
                                    Proposal drafts will appear here after the
                                    next successful run.
                                </div>
                            )}
                        </AdminSurfaceBody>
                    </AdminSurface>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                    <AdminSurface>
                        <AdminSurfaceHeader
                            title="Search results"
                            description="Reviews and complaint clusters tied to the active query."
                        />
                        <AdminSurfaceBody className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-medium text-slate-950">
                                        Matching reviews
                                    </p>
                                    <span className="text-xs text-slate-400">
                                        {reviews.length} results
                                    </span>
                                </div>
                                {reviews.length > 0 ? (
                                    <div className="space-y-2">
                                        {reviews.map((review) => (
                                            <article
                                                key={review.id}
                                                className="rounded-lg border border-slate-950/8 bg-slate-50/80 p-4"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                                                    <span>
                                                        {review.product}
                                                    </span>
                                                    <span>
                                                        {review.rating}/5 ·
                                                        score{' '}
                                                        {review.match_score}
                                                    </span>
                                                </div>
                                                {review.title ? (
                                                    <h3 className="mt-2 text-sm font-medium text-slate-950">
                                                        {review.title}
                                                    </h3>
                                                ) : null}
                                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                                    {review.body}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    <span className="rounded-full bg-sky-50 px-2 py-1 text-[11px] font-medium tracking-[0.16em] text-sky-700 uppercase">
                                                        {review.sentiment}
                                                    </span>
                                                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium tracking-[0.16em] text-amber-700 uppercase">
                                                        Severity{' '}
                                                        {review.severity}
                                                    </span>
                                                    {review.response_draft_status ? (
                                                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium tracking-[0.16em] text-emerald-700 uppercase">
                                                            Response{' '}
                                                            {
                                                                review.response_draft_status
                                                            }
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {review.tags.length > 0 ? (
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {review.tags.map(
                                                            (tag) => (
                                                                <span
                                                                    key={`${review.id}-${tag.name}`}
                                                                    className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-medium tracking-[0.16em] text-slate-600 uppercase"
                                                                >
                                                                    {tag.name}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : null}
                                                {review.response_draft ? (
                                                    <div className="mt-3 rounded-lg border border-slate-950/8 bg-white px-3 py-3">
                                                        <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                            Saved response draft
                                                        </p>
                                                        <p className="mt-2 text-sm leading-6 text-slate-700">
                                                            {
                                                                review.response_draft
                                                            }
                                                        </p>
                                                    </div>
                                                ) : null}
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-slate-950/8 px-4 py-8 text-sm leading-6 text-slate-500">
                                        Search results will appear here after
                                        you run a query.
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-950/6 pt-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-medium text-slate-950">
                                        Complaint clusters
                                    </p>
                                    <span className="text-xs text-slate-400">
                                        {clusters.length} groups
                                    </span>
                                </div>
                                {clusters.length > 0 ? (
                                    <div className="mt-3 space-y-2">
                                        {clusters.map((cluster) => (
                                            <article
                                                key={cluster.id}
                                                className="rounded-lg border border-slate-950/8 bg-slate-50/80 p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        {cluster.product ? (
                                                            <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                                {
                                                                    cluster.product
                                                                }
                                                            </p>
                                                        ) : null}
                                                        <h3 className="mt-1 text-sm font-medium text-slate-950">
                                                            {cluster.title}
                                                        </h3>
                                                    </div>
                                                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium tracking-[0.16em] text-slate-500 uppercase ring-1 ring-slate-950/8">
                                                        {cluster.review_count}{' '}
                                                        reviews
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                                    {cluster.summary}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium tracking-[0.16em] text-amber-700 uppercase">
                                                        Severity{' '}
                                                        {cluster.severity}
                                                    </span>
                                                    <span className="rounded-full bg-sky-50 px-2 py-1 text-[11px] font-medium tracking-[0.16em] text-sky-700 uppercase">
                                                        Score{' '}
                                                        {cluster.match_score}
                                                    </span>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-3 rounded-lg border border-dashed border-slate-950/8 px-4 py-8 text-sm leading-6 text-slate-500">
                                        Cluster summaries will appear here after
                                        the next query or run.
                                    </div>
                                )}
                            </div>
                        </AdminSurfaceBody>
                    </AdminSurface>

                    <div className="space-y-4">
                        <AdminSurface id="helper-setup">
                            <AdminSurfaceHeader
                                title="Local helper"
                                description="One command to connect the helper, then live heartbeat updates over Echo."
                            />
                            <AdminSurfaceBody className="space-y-4">
                                <div className="rounded-lg border border-slate-950/8 bg-slate-50/80 px-4 py-3">
                                    <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                        Heartbeat
                                    </p>
                                    <p className="mt-2 text-sm text-slate-700">
                                        {helperLastSeenAt ?? 'No check-in yet'}
                                    </p>
                                </div>

                                {flash.helper_token ? (
                                    <div className="space-y-3">
                                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-sm font-medium text-emerald-900">
                                                    Launch command for{' '}
                                                    {flash.helper_name ??
                                                        helper.default_name}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void copy(
                                                            helperBootstrapCommand,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                                >
                                                    {copiedText ===
                                                    helperBootstrapCommand ? (
                                                        <Check className="size-3.5" />
                                                    ) : (
                                                        <Copy className="size-3.5" />
                                                    )}
                                                    Copy
                                                </button>
                                            </div>
                                            <code className="mt-3 block overflow-x-auto rounded-lg bg-slate-950 px-3 py-3 text-xs text-emerald-200">
                                                {helperBootstrapCommand}
                                            </code>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.post(
                                                        admin.helperToken.store()
                                                            .url,
                                                    )
                                                }
                                                className="rounded-lg border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                                            >
                                                Regenerate helper token
                                            </button>
                                        </div>

                                        <div className="rounded-lg border border-slate-950/8 bg-slate-50/80 p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                    Rerun-only command
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void copy(
                                                            helperRunCommand,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-md border border-slate-950/10 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-950/20 hover:bg-slate-50"
                                                >
                                                    {copiedText ===
                                                    helperRunCommand ? (
                                                        <Check className="size-3.5" />
                                                    ) : (
                                                        <Copy className="size-3.5" />
                                                    )}
                                                    Copy
                                                </button>
                                            </div>
                                            <code className="mt-3 block overflow-x-auto rounded-lg bg-slate-950 px-3 py-3 text-xs text-slate-300">
                                                {helperRunCommand}
                                            </code>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-slate-950/8 px-4 py-6 text-sm leading-6 text-slate-500">
                                        Generate a command to launch the local
                                        helper on your machine.
                                    </div>
                                )}
                            </AdminSurfaceBody>
                        </AdminSurface>

                        <AdminSurface>
                            <AdminSurfaceHeader
                                title="Recent audit events"
                                description="A compact look at the latest system activity."
                                action={
                                    <Link
                                        href={admin.auditLog().url}
                                        className="text-sm font-medium text-slate-500 transition hover:text-slate-950"
                                    >
                                        Open audit log
                                    </Link>
                                }
                            />
                            <AdminSurfaceBody className="space-y-0 p-0">
                                {recentAuditLog.length > 0 ? (
                                    recentAuditLog.map((entry, index) => (
                                        <div
                                            key={entry.id}
                                            className={`px-4 py-3 ${
                                                index === 0
                                                    ? ''
                                                    : 'border-t border-slate-950/6'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {entry.action}
                                                    </p>
                                                    {entry.message ? (
                                                        <p className="mt-1 text-sm leading-5 text-slate-500">
                                                            {entry.message}
                                                        </p>
                                                    ) : null}
                                                    <p className="mt-1 text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                        {entry.actor_type}
                                                    </p>
                                                </div>
                                                <time className="shrink-0 text-xs text-slate-400">
                                                    {entry.created_at}
                                                </time>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-sm leading-6 text-slate-500">
                                        Audit events will appear here after the
                                        next run or proposal action.
                                    </div>
                                )}
                            </AdminSurfaceBody>
                        </AdminSurface>
                    </div>
                </div>
            </AdminPage>
        </AppLayout>
    );
}
