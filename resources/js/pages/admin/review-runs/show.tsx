import { Head, Link, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    ArrowLeft,
    Bot,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    CircleAlert,
    Loader2,
    Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    AdminHeader,
    AdminPage,
    AdminPill,
    AdminSurface,
} from '@/components/admin-page';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import {
    buildToolTickerItems,
    formatToolName,
    prettifyToolContent,
} from '@/pages/admin/review-runs/session-trace';
import type { ToolTraceActivity } from '@/pages/admin/review-runs/session-trace';
import type { BreadcrumbItem } from '@/types';
import admin from '@/routes/admin';
import { dashboard } from '@/routes/index';

interface PageProps {
    auth: {
        user: {
            id: number;
        };
    };
    [key: string]: unknown;
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

interface ReviewRunShowProps {
    run: {
        id: number;
        status: string;
        kind: string;
        summary: string | null;
        prompt: string | null;
        context: Record<string, unknown> | null;
        error_message: string | null;
        requested_at: string | null;
        started_at: string | null;
        completed_at: string | null;
        events: RunEventPayload[];
    };
}

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

function mergeAssistantEvents(events: RunEventPayload[]): RunEventPayload[] {
    return events.reduce<RunEventPayload[]>((current, event) => {
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
                action: 'codex.message',
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
}

function buildToolActivities(events: RunEventPayload[]): ToolTraceActivity[] {
    const toolActivities: ToolTraceActivity[] = [];
    const activityIndexById = new Map<string, number>();

    for (const event of events) {
        if (event.kind === 'tool_call') {
            const activityId =
                event.tool_id ??
                `${event.tool_name ?? 'tool'}-${event.id.toString()}`;

            activityIndexById.set(activityId, toolActivities.length);
            toolActivities.push({
                id: activityId,
                name: event.tool_name ?? 'Unknown tool',
                callContent: event.content,
                resultContent: null,
                startedAt: event.created_at,
                completedAt: null,
                status: 'running',
            });

            continue;
        }

        if (event.kind !== 'tool_result') {
            continue;
        }

        const matchingIndex =
            (event.tool_id !== null
                ? activityIndexById.get(event.tool_id)
                : undefined) ?? findLastRunningToolIndex(toolActivities, event);

        if (matchingIndex === undefined) {
            toolActivities.push({
                id:
                    event.tool_id ??
                    `${event.tool_name ?? 'tool'}-${event.id.toString()}`,
                name: event.tool_name ?? 'Unknown tool',
                callContent: null,
                resultContent: event.content,
                startedAt: event.created_at,
                completedAt: event.created_at,
                status: event.is_error ? 'error' : 'complete',
            });

            continue;
        }

        toolActivities[matchingIndex] = {
            ...toolActivities[matchingIndex],
            resultContent: event.content,
            completedAt: event.created_at,
            status: event.is_error ? 'error' : 'complete',
        };
    }

    return toolActivities;
}

function findLastRunningToolIndex(
    toolActivities: ToolTraceActivity[],
    event: RunEventPayload,
): number | undefined {
    for (let index = toolActivities.length - 1; index >= 0; index -= 1) {
        const activity = toolActivities[index];

        if (
            activity.status === 'running' &&
            activity.name === event.tool_name
        ) {
            return index;
        }
    }

    return undefined;
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

function humanizeAction(action: string): string {
    const labels: Record<string, string> = {
        'run.queued': 'Queued',
        'run.claimed': 'Helper claimed the run',
        'helper.started': 'Helper is preparing Codex',
        'helper.codex.starting': 'Starting Codex session',
        'mcp.server.ready': 'Signals MCP ready',
        'codex.thread.started': 'Thread created',
        'codex.thread.ready': 'Thread ready',
        'codex.turn.started': 'Analysis started',
        'run.completed': 'Run completed',
        'run.failed': 'Run failed',
    };

    return labels[action] ?? action.replaceAll('.', ' ');
}

function eventBody(event: RunEventPayload): string {
    return (
        event.content ??
        (typeof event.metadata.message === 'string'
            ? event.metadata.message
            : 'No message provided.')
    );
}

function statusClassName(status: string): string {
    if (status === 'completed') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (status === 'failed') {
        return 'border-red-200 bg-red-50 text-red-700';
    }

    if (status === 'running') {
        return 'border-sky-200 bg-sky-50 text-sky-700';
    }

    return 'border-slate-200 bg-slate-50 text-slate-600';
}

function TraceToolRow({
    tool,
    defaultOpen,
}: {
    tool: ToolTraceActivity;
    defaultOpen: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const running = tool.status === 'running';
    const failed = tool.status === 'error';
    const preview = running
        ? prettifyToolContent(tool.callContent)
        : prettifyToolContent(tool.resultContent);

    return (
        <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.6)] backdrop-blur-xl">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/90"
            >
                <span
                    className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full border',
                        running
                            ? 'border-sky-200 bg-sky-50 text-sky-500'
                            : failed
                              ? 'border-red-200 bg-red-50 text-red-500'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-500',
                    )}
                >
                    {running ? (
                        <Loader2 className="size-3.5 animate-spin" />
                    ) : failed ? (
                        <CircleAlert className="size-3.5" />
                    ) : (
                        <CheckCircle2 className="size-3.5" />
                    )}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-slate-950 capitalize">
                            {formatToolName(tool.name)}
                        </span>
                        <span
                            className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-medium tracking-[0.14em] uppercase',
                                running
                                    ? 'bg-sky-100 text-sky-700'
                                    : failed
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-slate-100 text-slate-500',
                            )}
                        >
                            {tool.status}
                        </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">
                        {preview}
                    </p>
                </div>
                <time className="shrink-0 text-[11px] text-slate-400">
                    {formatTimestamp(tool.startedAt)}
                </time>
                <ChevronDown
                    className={cn(
                        'size-3.5 shrink-0 text-slate-400 transition',
                        open && 'rotate-180',
                    )}
                />
            </button>
            {open ? (
                <div className="space-y-2 border-t border-slate-950/6 bg-slate-50/80 px-4 py-4">
                    <TraceBlock
                        label="Call"
                        content={tool.callContent ?? `Calling ${tool.name}`}
                    />
                    <TraceBlock
                        label="Result"
                        content={prettifyToolContent(tool.resultContent)}
                        mono
                    />
                </div>
            ) : null}
        </div>
    );
}

function TraceAssistantBubble({
    content,
    createdAt,
}: {
    content: string;
    createdAt: string;
}) {
    return (
        <div className="flex gap-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/80 text-slate-600 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.7)] backdrop-blur">
                <Sparkles className="size-4" />
            </div>
            <div className="max-w-[40rem] min-w-0">
                <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/85 px-5 py-4 shadow-[0_30px_120px_-60px_rgba(15,23,42,0.55)] backdrop-blur-xl">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-medium tracking-[0.22em] text-slate-400 uppercase">
                        <Bot className="size-3.5 text-sky-500" />
                        Signals
                    </div>
                    <p className="text-[15px] leading-7 whitespace-pre-wrap text-slate-700">
                        {content}
                    </p>
                </div>
                <time className="mt-2 block pl-2 text-[11px] text-slate-400">
                    {formatTimestamp(createdAt)}
                </time>
            </div>
        </div>
    );
}

function TraceStatusRow({ event }: { event: RunEventPayload }) {
    return (
        <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-slate-200/80" />
            <div
                className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-medium tracking-[0.18em] uppercase shadow-[0_10px_30px_-24px_rgba(15,23,42,0.5)]',
                    event.is_error
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-white/70 bg-white/80 text-slate-500 backdrop-blur',
                )}
            >
                <span
                    className={cn(
                        'size-1.5 rounded-full',
                        event.is_error ? 'bg-red-500' : 'bg-slate-300',
                    )}
                />
                {humanizeAction(event.action)}
                <span className="text-slate-300">•</span>
                <time className="text-slate-400">
                    {formatTimestamp(event.created_at)}
                </time>
            </div>
            <div className="h-px flex-1 bg-slate-200/80" />
        </div>
    );
}

function TraceBlock({
    label,
    content,
    mono = false,
}: {
    label: string;
    content: string;
    mono?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-slate-950/8 bg-white p-3.5">
            <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                {label}
            </p>
            {mono ? (
                <pre className="mt-2 max-h-52 overflow-y-auto text-xs leading-5 break-words whitespace-pre-wrap text-slate-700">
                    {content}
                </pre>
            ) : (
                <p className="mt-2 text-sm leading-6 text-slate-700">
                    {content}
                </p>
            )}
        </div>
    );
}

function ToolTicker({
    items,
    traceOpen,
    onToggleTrace,
}: {
    items: ReturnType<typeof buildToolTickerItems>;
    traceOpen: boolean;
    onToggleTrace: () => void;
}) {
    const [index, setIndex] = useState(0);
    const activeItem =
        items.length > 0 ? (items[index % items.length] ?? null) : null;

    useEffect(() => {
        if (items.length <= 1) {
            return undefined;
        }

        const interval = window.setInterval(() => {
            setIndex((currentIndex) => (currentIndex + 1) % items.length);
        }, 2600);

        return () => {
            window.clearInterval(interval);
        };
    }, [items.length]);

    if (activeItem === null) {
        return null;
    }

    return (
        <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 px-4 py-3 shadow-[0_24px_90px_-50px_rgba(14,165,233,0.35)] backdrop-blur-xl">
            <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-sky-100/90 via-white/0 to-white/0" />
            <div className="relative flex flex-wrap items-center gap-3">
                <div
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-full border',
                        activeItem.status === 'running'
                            ? 'border-sky-200 bg-sky-50 text-sky-600'
                            : activeItem.status === 'error'
                              ? 'border-red-200 bg-red-50 text-red-600'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-600',
                    )}
                >
                    {activeItem.status === 'running' ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : activeItem.status === 'error' ? (
                        <CircleAlert className="size-4" />
                    ) : (
                        <CheckCircle2 className="size-4" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-slate-400 uppercase">
                        <Sparkles className="size-3 text-sky-500" />
                        Live tool activity
                        <span className="text-slate-300">
                            {index + 1} / {items.length}
                        </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-slate-950 capitalize">
                        {activeItem.title}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                        {activeItem.detail}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onToggleTrace}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-950/10 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-950/20 hover:bg-slate-50"
                >
                    {traceOpen ? (
                        <ChevronUp className="size-3.5" />
                    ) : (
                        <ChevronDown className="size-3.5" />
                    )}
                    {traceOpen ? 'Hide trace' : 'Inspect trace'}
                </button>
            </div>
        </div>
    );
}

export default function ReviewAnalysisRunShow({ run }: ReviewRunShowProps) {
    const { auth } = usePage<PageProps>().props;
    const [runOverride, setRunOverride] = useState<RunUpdatedEvent | null>(
        null,
    );
    const [liveEvents, setLiveEvents] = useState<RunEventPayload[]>([]);
    const [traceOpen, setTraceOpen] = useState(run.status === 'failed');
    const scrollEndRef = useRef<HTMLDivElement | null>(null);
    const runUpdatedEventName = '.review-analysis-run.updated';
    const runEventCreatedEventName = '.review-analysis-event.created';
    const displayRun =
        runOverride?.id === run.id
            ? {
                  ...run,
                  status: runOverride.status,
                  summary: runOverride.summary,
                  error_message: runOverride.error_message,
              }
            : run;
    const events = [...run.events, ...liveEvents].filter(
        (event, index, allEvents) =>
            allEvents.findIndex((candidate) => candidate.id === event.id) ===
            index,
    );
    const mergedEvents = mergeAssistantEvents(events);
    const timelineEvents = mergedEvents.filter(
        (event) =>
            event.kind === 'assistant_text' ||
            milestoneActions.has(event.action) ||
            event.action === 'run.failed',
    );
    const toolActivities = buildToolActivities(mergedEvents);
    const timelineItems = timelineEvents.map((event) => ({
        type: 'timeline' as const,
        event,
        sortKey: event.created_at,
    }));
    const tickerItems = buildToolTickerItems(toolActivities);
    const streamItems = [...timelineItems].sort((a, b) =>
        a.sortKey.localeCompare(b.sortKey),
    );
    const focus =
        typeof run.context?.focus === 'string' ? run.context.focus : null;
    const isRunning = displayRun.status === 'running';
    const latestAssistantContent =
        [...timelineEvents]
            .reverse()
            .find((event) => event.kind === 'assistant_text')?.content ?? null;
    const latestTimelineSignature = streamItems
        .map((item) =>
            [
                item.event.id,
                item.event.kind ?? '',
                item.event.content ?? '',
            ].join(':'),
        )
        .join('|');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Start', href: dashboard() },
        { title: 'Session', href: admin.signals() },
        {
            title: `Run #${run.id.toString()}`,
            href: admin.reviewRuns.show(run.id),
        },
    ];

    useEcho<RunUpdatedEvent>(
        `signals.user.${auth.user.id}`,
        runUpdatedEventName,
        (payload) => {
            if (payload.id !== run.id) {
                return;
            }

            if (payload.status === 'failed') {
                setTraceOpen(true);
            }

            setRunOverride(payload);
        },
        [auth.user.id, run.id],
    );

    useEcho<RunEventPayload>(
        `signals.user.${auth.user.id}`,
        runEventCreatedEventName,
        (payload) => {
            if (payload.review_analysis_run_id !== run.id) {
                return;
            }

            setLiveEvents((current) => {
                if (current.some((event) => event.id === payload.id)) {
                    return current;
                }

                return [...current, payload];
            });
        },
        [auth.user.id, run.id],
    );

    useEffect(() => {
        scrollEndRef.current?.scrollIntoView({
            block: 'end',
            behavior: isRunning ? 'smooth' : 'auto',
        });
    }, [
        isRunning,
        latestAssistantContent,
        latestTimelineSignature,
        streamItems.length,
    ]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Signals session" />

            <AdminPage>
                <AdminHeader
                    eyebrow="Session"
                    title={focus ?? displayRun.summary ?? 'Signals session'}
                    meta={
                        <>
                            <AdminPill>Run #{run.id.toString()}</AdminPill>
                            <AdminPill
                                className={statusClassName(displayRun.status)}
                            >
                                {isRunning ? (
                                    <Loader2 className="size-3 animate-spin" />
                                ) : null}
                                {displayRun.status}
                            </AdminPill>
                        </>
                    }
                    actions={
                        <Link
                            href={admin.signals().url}
                            className="inline-flex items-center gap-2 rounded-sm border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                        >
                            <ArrowLeft className="size-4" />
                            Back to launcher
                        </Link>
                    }
                />

                <AdminSurface className="relative flex h-[calc(100dvh-12.5rem)] flex-col overflow-hidden border-white/50 bg-[linear-gradient(180deg,#f8fbff_0%,#f5f7fb_44%,#f8fafc_100%)]">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 left-[-8rem] h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" />
                        <div className="absolute top-24 right-[-6rem] h-56 w-56 rounded-full bg-cyan-200/25 blur-3xl" />
                        <div className="absolute bottom-[-8rem] left-1/3 h-64 w-64 rounded-full bg-slate-200/50 blur-3xl" />
                    </div>
                    {displayRun.error_message ? (
                        <div className="relative shrink-0 border-b border-red-200 bg-red-50/90 px-5 py-3 backdrop-blur">
                            <p className="text-sm leading-6 text-red-700">
                                {displayRun.error_message}
                            </p>
                        </div>
                    ) : displayRun.summary && focus ? (
                        <div className="relative shrink-0 border-b border-slate-950/6 px-5 py-2.5">
                            <p className="text-xs text-slate-500">
                                {displayRun.summary}
                            </p>
                        </div>
                    ) : null}

                    {tickerItems.length > 0 ? (
                        <div className="relative shrink-0 px-5 pt-4">
                            <div className="mx-auto max-w-3xl">
                                <ToolTicker
                                    items={tickerItems}
                                    traceOpen={traceOpen}
                                    onToggleTrace={() =>
                                        setTraceOpen((current) => !current)
                                    }
                                />
                            </div>
                        </div>
                    ) : null}

                    <div className="relative flex-1 overflow-y-auto px-5 py-6">
                        <div className="mx-auto max-w-3xl space-y-2">
                            {focus ? (
                                <div className="flex justify-end pl-12">
                                    <div className="rounded-full bg-slate-950 px-4 py-2.5 text-sm leading-6 text-white shadow-[0_24px_70px_-45px_rgba(15,23,42,0.95)]">
                                        {focus}
                                    </div>
                                </div>
                            ) : null}

                            {streamItems.length > 0 ? (
                                <div className="space-y-2">
                                    {streamItems.map((item) =>
                                        item.event.kind === 'assistant_text' ? (
                                            <TraceAssistantBubble
                                                key={item.event.id}
                                                content={eventBody(item.event)}
                                                createdAt={
                                                    item.event.created_at
                                                }
                                            />
                                        ) : (
                                            <TraceStatusRow
                                                key={item.event.id}
                                                event={item.event}
                                            />
                                        ),
                                    )}
                                </div>
                            ) : (
                                <div className="flex min-h-64 items-center justify-center">
                                    <div className="space-y-2 text-center">
                                        <Loader2 className="mx-auto size-6 animate-spin text-slate-300" />
                                        <p className="text-sm text-slate-400">
                                            Waiting for the helper to start…
                                        </p>
                                    </div>
                                </div>
                            )}

                            {toolActivities.length > 0 ? (
                                <div className="pt-6">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setTraceOpen((current) => !current)
                                        }
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-950/10 bg-white/85 px-3 py-1.5 text-xs font-medium tracking-[0.14em] text-slate-500 uppercase shadow-[0_18px_60px_-42px_rgba(15,23,42,0.65)] backdrop-blur"
                                    >
                                        {traceOpen ? (
                                            <ChevronUp className="size-3.5" />
                                        ) : (
                                            <ChevronDown className="size-3.5" />
                                        )}
                                        Full tool trace
                                    </button>

                                    {traceOpen ? (
                                        <div className="mt-4 space-y-3">
                                            {toolActivities.map(
                                                (tool, index) => (
                                                    <TraceToolRow
                                                        key={tool.id}
                                                        tool={tool}
                                                        defaultOpen={
                                                            tool.status ===
                                                                'running' ||
                                                            index === 0
                                                        }
                                                    />
                                                ),
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            <div ref={scrollEndRef} />
                        </div>
                    </div>
                </AdminSurface>
            </AdminPage>
        </AppLayout>
    );
}
