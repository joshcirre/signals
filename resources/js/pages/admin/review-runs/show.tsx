import { Head, Link, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    ArrowLeft,
    Bot,
    CheckCircle2,
    ChevronDown,
    CircleAlert,
    Loader2,
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

interface ToolActivity {
    id: string;
    name: string;
    callContent: string | null;
    resultContent: string | null;
    startedAt: string;
    completedAt: string | null;
    status: 'running' | 'complete' | 'error';
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

function buildToolActivities(events: RunEventPayload[]): ToolActivity[] {
    const toolActivities: ToolActivity[] = [];
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
    toolActivities: ToolActivity[],
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

function formatToolName(toolName: string): string {
    return toolName
        .replace(/^mcp__signals__/, '')
        .replace(/-tool$/, '')
        .replaceAll('-', ' ')
        .replaceAll('_', ' ');
}

function prettifyToolContent(content: string | null): string {
    if (content === null || content.trim() === '') {
        return 'Waiting for the tool result...';
    }

    return unwrapStructuredContent(content);
}

function unwrapStructuredContent(content: string): string {
    const trimmedContent = content.trim();

    try {
        const parsedContent = JSON.parse(trimmedContent) as unknown;

        if (
            Array.isArray(parsedContent) &&
            parsedContent.length > 0 &&
            typeof parsedContent[0] === 'object' &&
            parsedContent[0] !== null &&
            'text' in parsedContent[0] &&
            typeof parsedContent[0].text === 'string'
        ) {
            return unwrapStructuredContent(parsedContent[0].text);
        }

        if (typeof parsedContent === 'string') {
            return unwrapStructuredContent(parsedContent);
        }

        return JSON.stringify(parsedContent, null, 2);
    } catch {
        return content;
    }
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
    tool: ToolActivity;
    defaultOpen: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const running = tool.status === 'running';
    const failed = tool.status === 'error';

    return (
        <div className="overflow-hidden rounded-sm border border-slate-950/7 bg-white">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition hover:bg-slate-50"
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
                        <Loader2 className="size-3.5 animate-spin" />
                    ) : failed ? (
                        <CircleAlert className="size-3.5" />
                    ) : (
                        <CheckCircle2 className="size-3.5" />
                    )}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-slate-900 capitalize">
                    {formatToolName(tool.name)}
                </span>
                <time className="shrink-0 text-xs text-slate-400">
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
                <div className="space-y-2 border-t border-slate-950/6 bg-slate-50 px-4 py-4">
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
        <div className="flex gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-slate-950/10 bg-white text-slate-500">
                <Bot className="size-3.5" />
            </div>
            <div className="max-w-[38rem] min-w-0">
                <div className="rounded-sm border border-slate-950/8 bg-white px-4 py-3">
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

function TraceStatusRow({ event }: { event: RunEventPayload }) {
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
        <div className="rounded-sm border border-slate-950/8 bg-white p-3">
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

export default function ReviewAnalysisRunShow({ run }: ReviewRunShowProps) {
    const { auth } = usePage<PageProps>().props;
    const [runOverride, setRunOverride] = useState<RunUpdatedEvent | null>(
        null,
    );
    const [liveEvents, setLiveEvents] = useState<RunEventPayload[]>([]);
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
    const streamItems = [
        ...timelineEvents.map((e) => ({
            type: 'timeline' as const,
            event: e,
            sortKey: e.created_at,
        })),
        ...toolActivities.map((t) => ({
            type: 'tool' as const,
            tool: t,
            sortKey: t.startedAt,
        })),
    ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    const focus =
        typeof run.context?.focus === 'string' ? run.context.focus : null;
    const isRunning = displayRun.status === 'running';

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
    }, [isRunning, streamItems.length]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Run #${run.id.toString()}`} />

            <AdminPage>
                <AdminHeader
                    eyebrow={`Run #${run.id.toString()}`}
                    title={focus ?? displayRun.summary ?? 'Tool trace'}
                    meta={
                        <AdminPill
                            className={statusClassName(displayRun.status)}
                        >
                            {isRunning ? (
                                <Loader2 className="size-3 animate-spin" />
                            ) : null}
                            {displayRun.status}
                        </AdminPill>
                    }
                    actions={
                        <Link
                            href={admin.signals().url}
                            className="inline-flex items-center gap-2 rounded-sm border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                        >
                            <ArrowLeft className="size-4" />
                            Back to session
                        </Link>
                    }
                />

                <AdminSurface className="flex h-[calc(100dvh-12.5rem)] flex-col overflow-hidden">
                    {displayRun.summary && focus ? (
                        <div className="shrink-0 border-b border-slate-950/6 px-5 py-2.5">
                            <p className="text-xs text-slate-500">
                                {displayRun.summary}
                            </p>
                        </div>
                    ) : null}

                    <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-5">
                        <div className="mx-auto max-w-3xl space-y-2">
                            {focus ? (
                                <div className="flex justify-end pl-12">
                                    <div className="rounded-sm bg-slate-950 px-4 py-2.5 text-sm leading-6 text-white">
                                        {focus}
                                    </div>
                                </div>
                            ) : null}

                            {streamItems.length > 0 ? (
                                <div className="space-y-2">
                                    {streamItems.map((item) =>
                                        item.type === 'tool' ? (
                                            <TraceToolRow
                                                key={`tool-${item.tool.id}`}
                                                tool={item.tool}
                                                defaultOpen={
                                                    item.tool.status ===
                                                        'running' ||
                                                    toolActivities.length <= 5
                                                }
                                            />
                                        ) : item.event.kind ===
                                          'assistant_text' ? (
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

                            <div ref={scrollEndRef} />
                        </div>
                    </div>
                </AdminSurface>
            </AdminPage>
        </AppLayout>
    );
}
