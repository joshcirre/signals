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
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
    AdminHeader,
    AdminPage,
    AdminPill,
    AdminSurface,
    AdminSurfaceBody,
    AdminSurfaceHeader,
} from '@/components/admin-page';
import { useClipboard } from '@/hooks/use-clipboard';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import {
    deriveSessionFeedState,
    eventBody,
} from '@/pages/admin/signals-session-feed';
import type {
    RunEventPayload,
    SessionActivityItem,
    ToolActivity,
} from '@/pages/admin/signals-session-feed';
import type { BreadcrumbItem } from '@/types';
import admin from '@/routes/admin';
import { dashboard } from '@/routes/index';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Start',
        href: dashboard(),
    },
    {
        title: 'Session',
        href: admin.signals(),
    },
];

const milestoneActions = new Set([
    'run.queued',
    'run.claimed',
    'helper.started',
    'helper.codex.starting',
    'mcp.server.ready',
    'codex.thread.started',
    'codex.thread.ready',
    'codex.turn.started',
    'run.completed',
    'run.failed',
]);

interface PageProps {
    appUrl: string;
    repositoryUrl: string;
    auth: {
        user: {
            id: number;
        };
    };
    [key: string]: unknown;
}

interface SignalsProps {
    filters: {
        q: string;
    };
    helper: {
        default_name: string;
        name: string;
        token: string | null;
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
}

interface RunUpdatedEvent {
    id: number;
    status: string;
    summary: string | null;
    error_message: string | null;
}

interface HelperHeartbeatUpdatedEvent {
    id: number;
    name: string;
    last_seen_at: string | null;
    last_seen_at_human: string | null;
    is_active: boolean;
}

type SignalsPageProps = Omit<SignalsProps, 'products'>;

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

function humanizeAction(action: string): string {
    const labels: Record<string, string> = {
        'run.queued': 'Queued',
        'run.claimed': 'Helper claimed the run',
        'helper.started': 'Helper preparing Codex',
        'helper.codex.starting': 'Starting Codex session',
        'mcp.server.ready': 'Signals MCP ready',
        'codex.thread.started': 'Thread created',
        'codex.thread.ready': 'Thread ready',
        'codex.turn.started': 'Analysis started',
        'run.completed': 'Session completed',
        'run.failed': 'Session failed',
    };

    return labels[action] ?? action.replaceAll('.', ' ');
}

function formatTimestamp(value: string | null): string {
    if (value === null) {
        return 'Pending';
    }

    return new Date(value).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatToolName(toolName: string | null): string {
    if (!toolName) {
        return 'Signals tool';
    }

    return toolName
        .replace(/^mcp__signals__/, '')
        .replace(/-tool$/, '')
        .replaceAll('-', ' ')
        .replaceAll('_', ' ');
}

function SessionUserBubble({ content }: { content: string }) {
    return (
        <div className="flex justify-end pl-12">
            <div className="rounded-sm bg-slate-950 px-4 py-2.5 text-sm leading-6 text-white">
                {content}
            </div>
        </div>
    );
}

function SessionAssistantBubble({
    content,
    createdAt,
    live,
}: {
    content: string;
    createdAt: string;
    live?: boolean;
}) {
    return (
        <div className="flex gap-3">
            <div
                className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border text-slate-500',
                    live
                        ? 'border-sky-200 bg-sky-50 text-sky-600'
                        : 'border-slate-950/10 bg-white',
                )}
            >
                {live ? (
                    <Loader2 className="size-3.5 animate-spin" />
                ) : (
                    <Bot className="size-3.5" />
                )}
            </div>
            <div className="max-w-[38rem] min-w-0">
                <div
                    className={cn(
                        'rounded-sm border px-4 py-3',
                        live
                            ? 'border-sky-200 bg-white shadow-[0_0_0_1px_rgba(14,165,233,0.06)]'
                            : 'border-slate-950/8 bg-white',
                    )}
                >
                    {live ? (
                        <div className="mb-2 flex items-center gap-2 text-[10px] font-medium tracking-[0.18em] text-sky-600 uppercase">
                            <span className="size-1.5 rounded-full bg-sky-500" />
                            Live update
                        </div>
                    ) : null}
                    <p className="text-sm leading-6 whitespace-pre-wrap text-slate-700">
                        {content}
                    </p>
                </div>
                <time className="mt-1 block text-[11px] text-slate-400">
                    {formatTimestamp(createdAt)}
                </time>
            </div>
        </div>
    );
}

function SessionStatusRow({ event }: { event: RunEventPayload }) {
    return (
        <div className="flex items-center gap-2 py-0.5 pl-10 text-xs">
            <span
                className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    event.is_error ? 'bg-red-400' : 'bg-slate-300',
                )}
            />
            <span
                className={cn(
                    'truncate',
                    event.is_error ? 'text-red-500' : 'text-slate-400',
                )}
            >
                {humanizeAction(event.action)}
            </span>
            <time className="ml-auto shrink-0 text-slate-300">
                {formatTimestamp(event.created_at)}
            </time>
        </div>
    );
}

function SessionToolRow({
    tool,
    latestRunId,
}: {
    tool: ToolActivity;
    latestRunId: number;
}) {
    const running = tool.status === 'running';
    const failed = tool.status === 'error';

    return (
        <Link
            href={admin.reviewRuns.show(latestRunId).url}
            className="flex items-center gap-2 py-0.5 pl-10 text-xs transition"
        >
            <span
                className={cn(
                    'shrink-0',
                    running
                        ? 'text-sky-400'
                        : failed
                          ? 'text-red-400'
                          : 'text-emerald-400',
                )}
            >
                {running ? (
                    <Loader2 className="size-3 animate-spin" />
                ) : failed ? (
                    <ShieldX className="size-3" />
                ) : (
                    <Check className="size-3" />
                )}
            </span>
            <span
                className={cn(
                    'truncate',
                    running
                        ? 'text-sky-600'
                        : failed
                          ? 'text-red-500'
                          : 'text-slate-400',
                )}
            >
                {formatToolName(tool.name)}
            </span>
        </Link>
    );
}

function SessionActivityFeed({
    items,
    latestRunId,
}: {
    items: SessionActivityItem[];
    latestRunId: number;
}) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            <div className="pl-10 text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                Run activity
            </div>
            <div className="space-y-2">
                {items.map((item) =>
                    item.type === 'tool' ? (
                        <SessionToolRow
                            key={`tool-${item.tool.id}`}
                            tool={item.tool}
                            latestRunId={latestRunId}
                        />
                    ) : (
                        <SessionStatusRow
                            key={item.event.id}
                            event={item.event}
                        />
                    ),
                )}
            </div>
        </div>
    );
}

function ProposalPreview({
    proposal,
}: {
    proposal: SignalsProps['pendingProposals'][number];
}) {
    return (
        <div className="rounded-sm border border-slate-950/7 bg-slate-50 px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-slate-950">
                    {proposal.target_label}
                </p>
                <span className="text-xs font-medium text-slate-400">
                    {(proposal.confidence * 100).toFixed(0)}%
                </span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                {proposal.rationale}
            </p>
        </div>
    );
}

export default function Signals({
    filters,
    helper,
    latestRun,
    pendingProposals,
    reviews,
    clusters,
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
}: SignalsPageProps) {
    const helperHeartbeatEventName = '.signals-helper.heartbeat.updated';
    const runUpdatedEventName = '.review-analysis-run.updated';
    const runEventCreatedEventName = '.review-analysis-event.created';
    const { appUrl, auth, repositoryUrl } = usePage<PageProps>().props;
    const [query, setQuery] = useState(filters.q);
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
    const composerEndRef = useRef<HTMLDivElement | null>(null);
    const helperServerUrl = appUrl;
    const helperBootstrapCommand = helper.token
        ? [
              'tmp_dir="${TMPDIR:-/tmp}/signals-helper"',
              'rm -rf "$tmp_dir"',
              `git clone ${repositoryUrl} "$tmp_dir"`,
              'cd "$tmp_dir"',
              'npm install --prefix desktop-helper',
              `SIGNALS_SERVER_URL=${helperServerUrl} SIGNALS_DEVICE_TOKEN=${helper.token} node desktop-helper/index.mjs`,
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
    const sessionFeed = deriveSessionFeedState(events, milestoneActions);
    const sessionFocus =
        typeof runState?.context?.focus === 'string' && runState.context.focus
            ? runState.context.focus
            : runState === null && query !== ''
              ? query
              : null;

    useEffect(() => {
        composerEndRef.current?.scrollIntoView({
            block: 'end',
            behavior: runState?.status === 'running' ? 'smooth' : 'auto',
        });
    }, [
        runState?.status,
        sessionFeed.activityItems.length,
        sessionFeed.liveAssistantEvent?.content,
        sessionFeed.liveAssistantEvent?.id,
    ]);

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

                return current.some((event) => event.id === payload.id)
                    ? current
                    : [...current, payload];
            });
        },
        [auth.user.id, latestRun?.id],
    );

    const previewEvidence = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            admin.signals().url,
            { q: query },
            { preserveState: true, preserveScroll: true },
        );
    };

    const startSession = () => {
        router.post(admin.reviewRuns.store().url, {
            kind: 'review_analysis',
            focus: query,
            redirect_to: 'signals',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Session" />

            <AdminPage>
                <AdminHeader
                    eyebrow="Session"
                    title="Signals session"
                    meta={
                        <>
                            <AdminPill
                                className={runStatusClassName(runState?.status)}
                            >
                                {runState?.status ?? 'idle'}
                            </AdminPill>
                            <AdminPill>
                                <span
                                    className={cn(
                                        'size-1.5 rounded-full',
                                        needsHelperSetup
                                            ? 'bg-amber-400'
                                            : 'bg-emerald-500',
                                    )}
                                />
                                {needsHelperSetup
                                    ? 'Helper offline'
                                    : 'Helper connected'}
                            </AdminPill>
                        </>
                    }
                    actions={
                        latestRun ? (
                            <Link
                                href={admin.reviewRuns.show(latestRun.id).url}
                                className="inline-flex items-center gap-2 rounded-sm border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                            >
                                Open tool trace
                            </Link>
                        ) : null
                    }
                />

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <AdminSurface className="flex h-[calc(100dvh-12.5rem)] flex-col overflow-hidden">
                        {runState?.summary ? (
                            <div className="shrink-0 border-b border-slate-950/6 px-5 py-2.5">
                                <p className="text-xs text-slate-500">
                                    {runState.summary}
                                </p>
                            </div>
                        ) : null}

                        <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-5">
                            <div className="mx-auto max-w-3xl space-y-3">
                                {sessionFocus ? (
                                    <SessionUserBubble content={sessionFocus} />
                                ) : null}

                                {sessionFeed.liveAssistantEvent ? (
                                    <SessionAssistantBubble
                                        content={eventBody(
                                            sessionFeed.liveAssistantEvent,
                                        )}
                                        createdAt={
                                            sessionFeed.liveAssistantEvent
                                                .created_at
                                        }
                                        live={runState?.status === 'running'}
                                    />
                                ) : null}

                                <SessionActivityFeed
                                    items={sessionFeed.activityItems}
                                    latestRunId={
                                        runState?.id ?? latestRun?.id ?? 0
                                    }
                                />

                                {!sessionFocus &&
                                sessionFeed.activityItems.length === 0 &&
                                sessionFeed.liveAssistantEvent === null &&
                                runState?.status !== 'running' ? (
                                    <div className="flex min-h-64 items-center justify-center text-center">
                                        <div className="space-y-2">
                                            <Radar className="mx-auto size-8 text-slate-300" />
                                            <p className="text-sm text-slate-400">
                                                Type a focus below to start a
                                                session.
                                            </p>
                                        </div>
                                    </div>
                                ) : null}

                                {runState?.status === 'running' &&
                                sessionFeed.activityItems.length === 0 &&
                                sessionFeed.liveAssistantEvent === null ? (
                                    <div className="flex items-center gap-2 pl-10 text-xs text-slate-400">
                                        <Loader2 className="size-3.5 animate-spin text-sky-400" />
                                        Waiting for the helper…
                                    </div>
                                ) : null}

                                <div ref={composerEndRef} />
                            </div>
                        </div>

                        <div className="shrink-0 border-t border-slate-950/6 p-4">
                            <form
                                onSubmit={previewEvidence}
                                className="mx-auto max-w-3xl space-y-2"
                            >
                                <div className="rounded-sm border border-slate-950/8 bg-white p-3">
                                    <label
                                        htmlFor="signals-session-query"
                                        className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase"
                                    >
                                        Focus this session
                                    </label>
                                    <textarea
                                        id="signals-session-query"
                                        value={query}
                                        onChange={(event) =>
                                            setQuery(event.target.value)
                                        }
                                        rows={1}
                                        placeholder="Premium hoodie sizing complaints that should become one clear fit-note proposal…"
                                        className="mt-2 max-h-32 w-full resize-none bg-transparent text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400"
                                        onInput={(e) => {
                                            const target =
                                                e.target as HTMLTextAreaElement;
                                            target.style.height = 'auto';
                                            target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                                        }}
                                    />
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <button
                                            type="submit"
                                            className="inline-flex items-center gap-2 rounded-sm border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                                        >
                                            <Search className="size-4" />
                                            Preview evidence
                                        </button>
                                        <button
                                            type="button"
                                            onClick={startSession}
                                            disabled={needsHelperSetup}
                                            className="inline-flex items-center gap-2 rounded-sm bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                        >
                                            <CirclePlay className="size-4" />
                                            Start session
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400">
                                    {needsHelperSetup
                                        ? 'Helper setup required before a session can stream.'
                                        : `Helper last checked in ${helperLastSeenAtHuman ?? 'recently'}.`}
                                </p>
                            </form>
                        </div>
                    </AdminSurface>

                    <div className="space-y-4">
                        <AdminSurface>
                            <AdminSurfaceHeader
                                title={
                                    needsHelperSetup
                                        ? 'Helper setup'
                                        : 'Session handoff'
                                }
                            />
                            <AdminSurfaceBody className="space-y-3">
                                {needsHelperSetup ? (
                                    <>
                                        <div className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                                            The session launcher stays disabled
                                            until the helper checks in.
                                        </div>
                                        <div className="rounded-sm border border-slate-950/8 bg-slate-950 p-4 text-slate-50">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-xs font-medium tracking-[0.16em] text-slate-400 uppercase">
                                                    Bootstrap command
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void copy(
                                                            helperBootstrapCommand,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-sm border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-slate-800"
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
                                    <>
                                        <div className="rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                                            The helper is connected and the
                                            session view is ready to stream the
                                            next run.
                                        </div>
                                        {latestRun ? (
                                            <Link
                                                href={
                                                    admin.reviewRuns.show(
                                                        latestRun.id,
                                                    ).url
                                                }
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                                            >
                                                Open full tool trace
                                            </Link>
                                        ) : null}
                                        <Link
                                            href={admin.proposals.index().url}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                                        >
                                            Review pending resolutions
                                        </Link>
                                    </>
                                )}
                            </AdminSurfaceBody>
                        </AdminSurface>

                        <AdminSurface>
                            <AdminSurfaceHeader title="Evidence" />
                            <AdminSurfaceBody className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                        Complaint clusters
                                    </p>
                                    {clusters.slice(0, 3).length > 0 ? (
                                        clusters.slice(0, 3).map((cluster) => (
                                            <div
                                                key={cluster.id}
                                                className="rounded-sm border border-slate-950/7 bg-slate-50 px-3.5 py-3"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-sm font-medium text-slate-950">
                                                        {cluster.title}
                                                    </p>
                                                    <span className="text-xs text-slate-400">
                                                        {cluster.review_count}{' '}
                                                        reviews
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm leading-5 text-slate-500">
                                                    {cluster.summary}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">
                                            Preview evidence with a search to
                                            pull the most relevant clusters into
                                            view.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                        Supporting reviews
                                    </p>
                                    {reviews.slice(0, 3).length > 0 ? (
                                        reviews.slice(0, 3).map((review) => (
                                            <div
                                                key={review.id}
                                                className="rounded-sm border border-slate-950/7 bg-white px-3.5 py-3"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-sm font-medium text-slate-950">
                                                        {review.title ??
                                                            review.product ??
                                                            'Review signal'}
                                                    </p>
                                                    <span className="text-xs text-slate-400">
                                                        {review.rating}/5
                                                    </span>
                                                </div>
                                                <p className="mt-1 line-clamp-3 text-sm leading-5 text-slate-500">
                                                    {review.body}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">
                                            No review evidence is visible for
                                            the current query yet.
                                        </p>
                                    )}
                                </div>
                            </AdminSurfaceBody>
                        </AdminSurface>

                        {pendingProposals.length > 0 ? (
                            <AdminSurface>
                                <AdminSurfaceHeader title="Ready for review" />
                                <AdminSurfaceBody className="space-y-3">
                                    {pendingProposals
                                        .slice(0, 3)
                                        .map((proposal) => (
                                            <ProposalPreview
                                                key={proposal.id}
                                                proposal={proposal}
                                            />
                                        ))}
                                    <Link
                                        href={admin.proposals.index().url}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                                    >
                                        Open review queue
                                    </Link>
                                </AdminSurfaceBody>
                            </AdminSurface>
                        ) : null}
                    </div>
                </div>
            </AdminPage>
        </AppLayout>
    );
}
