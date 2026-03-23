import { Head, Link, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    ArrowLeft,
    Bot,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    Clock3,
    Loader2,
    MessageSquareText,
    Sparkles,
    Workflow,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

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

    return (
        labels[action] ??
        action
            .split('.')
            .map(
                (segment) => segment.charAt(0).toUpperCase() + segment.slice(1),
            )
            .join(' ')
    );
}

function eventBody(event: RunEventPayload): string {
    return (
        event.content ??
        (typeof event.metadata.message === 'string'
            ? event.metadata.message
            : 'No message provided.')
    );
}

function runKindLabel(kind: string): string {
    if (kind === 'storefront_adaptation') {
        return 'Storefront adaptation';
    }

    return 'Live analysis';
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

function statusBadgeClassName(status: string): string {
    if (status === 'completed') {
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700';
    }

    if (status === 'failed') {
        return 'border-red-500/20 bg-red-500/10 text-red-700';
    }

    if (status === 'running') {
        return 'border-sky-500/20 bg-sky-500/10 text-sky-700';
    }

    return 'border-slate-950/10 bg-white/80 text-slate-600';
}

function toolStatusBadgeClassName(status: ToolActivity['status']): string {
    if (status === 'complete') {
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700';
    }

    if (status === 'error') {
        return 'border-red-500/20 bg-red-500/10 text-red-700';
    }

    return 'border-sky-500/20 bg-sky-500/10 text-sky-700';
}

function SummaryStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-950/8 bg-white/80 px-4 py-3">
            <p className="text-[11px] font-medium tracking-[0.2em] text-slate-400 uppercase">
                {label}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
        </div>
    );
}

function ThreadMessage({
    event,
    isAssistant,
}: {
    event: RunEventPayload;
    isAssistant: boolean;
}) {
    if (isAssistant) {
        return (
            <div className="relative flex gap-4 pl-2">
                <div className="flex w-10 shrink-0 justify-center">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-sm">
                        <Bot className="size-4" />
                    </div>
                </div>
                <div className="min-w-0 flex-1 rounded-xl rounded-tl-md border border-sky-500/10 bg-sky-50/80 px-4 py-3.5 shadow-sm shadow-sky-500/5">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-sky-900">
                            Assistant
                        </p>
                        <time className="text-xs text-slate-400">
                            {formatTimestamp(event.created_at)}
                        </time>
                    </div>
                    <p className="mt-3 text-sm leading-6 whitespace-pre-wrap text-slate-700">
                        {eventBody(event)}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex gap-4 pl-2">
            <div className="flex w-10 shrink-0 justify-center">
                <div className="mt-2 size-3 rounded-full border-4 border-white bg-slate-300 shadow-sm" />
            </div>
            <div
                className={cn(
                    'min-w-0 flex-1 rounded-xl border px-4 py-3',
                    event.is_error
                        ? 'border-red-200 bg-red-50/80'
                        : 'border-slate-950/8 bg-slate-50/85',
                )}
            >
                <div className="flex items-center justify-between gap-3">
                    <p
                        className={cn(
                            'text-sm font-medium',
                            event.is_error ? 'text-red-800' : 'text-slate-900',
                        )}
                    >
                        {humanizeAction(event.action)}
                    </p>
                    <time
                        className={cn(
                            'text-xs',
                            event.is_error
                                ? 'text-red-500/80'
                                : 'text-slate-400',
                        )}
                    >
                        {formatTimestamp(event.created_at)}
                    </time>
                </div>
                <p
                    className={cn(
                        'mt-1 text-sm text-pretty',
                        event.is_error ? 'text-red-700' : 'text-slate-600',
                    )}
                >
                    {eventBody(event)}
                </p>
            </div>
        </div>
    );
}

function ToolWorkbench({
    toolActivities,
    resolvedActiveToolIndex,
    activeTool,
    isRunning,
    onPrevious,
    onNext,
    onSelect,
}: {
    toolActivities: ToolActivity[];
    resolvedActiveToolIndex: number;
    activeTool: ToolActivity | null;
    isRunning: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onSelect: (index: number) => void;
}) {
    return (
        <Card className="gap-0 overflow-hidden rounded-xl border-slate-950/10 bg-white/90 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.32)]">
            <CardHeader className="gap-3 border-b border-slate-950/8 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.88))] px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg text-slate-950">
                            Tool Workbench
                        </CardTitle>
                        <CardDescription className="mt-1 text-sm text-slate-500">
                            One focused tool at a time, with the full trace
                            tucked underneath.
                        </CardDescription>
                    </div>
                    <Badge
                        variant="outline"
                        className="rounded-full border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium tracking-[0.18em] text-slate-500 uppercase"
                    >
                        {isRunning && toolActivities.length > 1
                            ? 'Auto cycle'
                            : 'Manual'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-5 px-5 py-5">
                {activeTool ? (
                    <>
                        <div className="rounded-xl border border-slate-950/10 bg-slate-950 p-4 text-slate-50 shadow-lg shadow-slate-950/8">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-medium tracking-[0.22em] text-slate-400 uppercase">
                                        Active step
                                    </p>
                                    <h3 className="mt-2 text-lg font-semibold capitalize">
                                        {formatToolName(activeTool.name)}
                                    </h3>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.16em] uppercase',
                                        toolStatusBadgeClassName(
                                            activeTool.status,
                                        ),
                                    )}
                                >
                                    {activeTool.status}
                                </Badge>
                            </div>
                            <div className="mt-4 grid gap-3">
                                <ToolWorkbenchPanel
                                    label="Call"
                                    content={
                                        activeTool.callContent ??
                                        `Calling ${activeTool.name}`
                                    }
                                />
                                <ToolWorkbenchPanel
                                    label="Result"
                                    content={prettifyToolContent(
                                        activeTool.resultContent,
                                    )}
                                    mono
                                />
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                <span>
                                    Started{' '}
                                    {formatTimestamp(activeTool.startedAt)}
                                </span>
                                <span className="text-slate-600">•</span>
                                <span>
                                    Finished{' '}
                                    {formatTimestamp(activeTool.completedAt)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onPrevious}
                                    className="rounded-full border-slate-200 bg-white px-3"
                                >
                                    <ChevronLeft className="size-4" />
                                    Previous
                                </Button>
                                <p className="text-xs font-medium text-slate-500">
                                    {(resolvedActiveToolIndex + 1).toString()} /{' '}
                                    {toolActivities.length.toString()}
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onNext}
                                    className="rounded-full border-slate-200 bg-white px-3"
                                >
                                    Next
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {toolActivities.map((tool, index) => (
                                    <button
                                        key={tool.id}
                                        type="button"
                                        onClick={() => onSelect(index)}
                                        className={cn(
                                            'min-w-0 shrink-0 rounded-full border px-3 py-2 text-left transition',
                                            index === resolvedActiveToolIndex
                                                ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.16em] uppercase">
                                                {(index + 1).toString()}
                                            </span>
                                            <span className="max-w-36 truncate text-xs font-medium capitalize">
                                                {formatToolName(tool.name)}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="rounded-xl border border-dashed border-slate-950/10 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                        Tool calls will appear here as soon as Codex starts
                        using the Signals MCP tools.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ToolWorkbenchPanel({
    label,
    content,
    mono = false,
}: {
    label: string;
    content: string;
    mono?: boolean;
}) {
    return (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                {label}
            </p>
            {mono ? (
                <pre className="mt-2 max-h-56 overflow-y-auto text-sm leading-6 break-words whitespace-pre-wrap text-slate-200">
                    {content}
                </pre>
            ) : (
                <p className="mt-2 text-sm leading-6 text-slate-100">
                    {content}
                </p>
            )}
        </div>
    );
}

function ToolTrace({
    toolActivities,
    activeToolIndex,
    running,
    onSelect,
}: {
    toolActivities: ToolActivity[];
    activeToolIndex: number;
    running: boolean;
    onSelect: (index: number) => void;
}) {
    return (
        <Card className="gap-0 overflow-hidden rounded-xl border-slate-950/10 bg-white/90 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.32)]">
            <Collapsible defaultOpen={running || toolActivities.length <= 3}>
                <CardHeader className="border-b border-slate-950/8 px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-base text-slate-950">
                                Full Tool Trace
                            </CardTitle>
                            <CardDescription className="mt-1 text-sm text-slate-500">
                                Expand a step when you need the raw inputs or
                                outputs.
                            </CardDescription>
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full border-slate-200 bg-white px-3"
                            >
                                {toolActivities.length.toString()} steps
                                <ChevronDown className="size-4" />
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent className="space-y-3 px-5 py-5">
                        {toolActivities.length > 0 ? (
                            toolActivities.map((tool, index) => (
                                <Collapsible
                                    key={tool.id}
                                    defaultOpen={index === activeToolIndex}
                                >
                                    <div
                                        className={cn(
                                            'overflow-hidden rounded-xl border transition',
                                            index === activeToolIndex
                                                ? 'border-slate-950/15 bg-slate-50'
                                                : 'border-slate-200 bg-white',
                                        )}
                                    >
                                        <CollapsibleTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={() => onSelect(index)}
                                                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                                            {(
                                                                index + 1
                                                            ).toString()}
                                                        </span>
                                                        <p className="truncate text-sm font-medium text-slate-900 capitalize">
                                                            {formatToolName(
                                                                tool.name,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {formatTimestamp(
                                                            tool.startedAt,
                                                        )}{' '}
                                                        ·{' '}
                                                        {tool.status ===
                                                        'running'
                                                            ? 'In progress'
                                                            : 'Finished'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.16em] uppercase',
                                                            toolStatusBadgeClassName(
                                                                tool.status,
                                                            ),
                                                        )}
                                                    >
                                                        {tool.status}
                                                    </Badge>
                                                    <ChevronDown className="size-4 text-slate-400" />
                                                </div>
                                            </button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="grid gap-3 border-t border-slate-950/8 px-4 py-4">
                                                <TraceBlock
                                                    label="Call"
                                                    content={
                                                        tool.callContent ??
                                                        `Calling ${tool.name}`
                                                    }
                                                />
                                                <TraceBlock
                                                    label="Result"
                                                    content={prettifyToolContent(
                                                        tool.resultContent,
                                                    )}
                                                    mono
                                                />
                                            </div>
                                        </CollapsibleContent>
                                    </div>
                                </Collapsible>
                            ))
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                The full tool trace will appear once the first
                                MCP call is emitted.
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
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
        <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
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

function NoticesPanel({ noticeEvents }: { noticeEvents: RunEventPayload[] }) {
    return (
        <Card className="gap-0 overflow-hidden rounded-xl border-slate-950/10 bg-white/90 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.32)]">
            <Collapsible defaultOpen={noticeEvents.length > 0}>
                <CardHeader className="border-b border-slate-950/8 px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-base text-slate-950">
                                System Notices
                            </CardTitle>
                            <CardDescription className="mt-1 text-sm text-slate-500">
                                stderr output, warnings, and helper issues stay
                                out of the main conversation.
                            </CardDescription>
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full border-slate-200 bg-white px-3"
                            >
                                {noticeEvents.length.toString()} notices
                                <ChevronDown className="size-4" />
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent className="px-5 py-5">
                        {noticeEvents.length > 0 ? (
                            <div className="space-y-3">
                                {noticeEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-medium text-red-800">
                                                {humanizeAction(event.action)}
                                            </p>
                                            <time className="text-xs text-red-500/80">
                                                {formatTimestamp(
                                                    event.created_at,
                                                )}
                                            </time>
                                        </div>
                                        <p className="mt-1 text-sm whitespace-pre-wrap text-red-700">
                                            {eventBody(event)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
                                No warnings or stderr notices have been streamed
                                for this run.
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

export default function ReviewAnalysisRunShow({ run }: ReviewRunShowProps) {
    const { auth } = usePage<PageProps>().props;
    const [runOverride, setRunOverride] = useState<RunUpdatedEvent | null>(
        null,
    );
    const [liveEvents, setLiveEvents] = useState<RunEventPayload[]>([]);
    const [activeToolIndex, setActiveToolIndex] = useState(
        Number.MAX_SAFE_INTEGER,
    );
    const timelineEndRef = useRef<HTMLDivElement | null>(null);
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
    const resolvedActiveToolIndex =
        toolActivities.length === 0
            ? 0
            : Math.min(activeToolIndex, toolActivities.length - 1);
    const activeTool =
        toolActivities.length > 0
            ? toolActivities[resolvedActiveToolIndex]
            : null;
    const noticeEvents = mergedEvents.filter(
        (event) =>
            event.is_error ||
            event.action === 'codex.stderr' ||
            event.action === 'codex.stderr.delta',
    );
    const milestoneCount = timelineEvents.filter((event) =>
        milestoneActions.has(event.action),
    ).length;
    const assistantMessageCount = timelineEvents.filter(
        (event) => event.kind === 'assistant_text',
    ).length;
    const completedToolCount = toolActivities.filter(
        (tool) => tool.status === 'complete',
    ).length;
    const errorCount = noticeEvents.length;
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Admin Dashboard',
            href: dashboard(),
        },
        {
            title: 'Signals',
            href: admin.signals(),
        },
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
        timelineEndRef.current?.scrollIntoView({
            block: 'end',
            behavior: displayRun.status === 'running' ? 'smooth' : 'auto',
        });
    }, [displayRun.status, events.length]);

    useEffect(() => {
        if (displayRun.status !== 'running' || toolActivities.length < 2) {
            return;
        }

        const interval = window.setInterval(() => {
            setActiveToolIndex((current) => {
                const currentIndex =
                    current >= toolActivities.length
                        ? toolActivities.length - 1
                        : current;

                return (currentIndex + 1) % toolActivities.length;
            });
        }, 2800);

        return () => {
            window.clearInterval(interval);
        };
    }, [displayRun.status, toolActivities.length]);

    const selectToolAt = (index: number) => {
        setActiveToolIndex(index);
    };

    const showPreviousTool = () => {
        setActiveToolIndex((current) => {
            if (toolActivities.length === 0) {
                return current;
            }

            const currentIndex =
                current >= toolActivities.length
                    ? toolActivities.length - 1
                    : current;

            return currentIndex === 0
                ? toolActivities.length - 1
                : currentIndex - 1;
        });
    };

    const showNextTool = () => {
        setActiveToolIndex((current) => {
            if (toolActivities.length === 0) {
                return current;
            }

            const currentIndex =
                current >= toolActivities.length
                    ? toolActivities.length - 1
                    : current;

            return (currentIndex + 1) % toolActivities.length;
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Run #${run.id.toString()}`} />
            <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.05),_transparent_24%),linear-gradient(180deg,_#f7f7f8,_#ffffff_28%,_#fbfbfc)] p-4 md:p-6">
                <div className="mx-auto max-w-7xl space-y-5">
                    <Card className="gap-0 overflow-hidden rounded-xl border-slate-950/10 bg-white/90 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.32)]">
                        <CardHeader className="gap-4 border-b border-slate-950/8 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.92))] px-4 py-4 md:px-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-3">
                                    <Link
                                        href={admin.signals().url}
                                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                                    >
                                        <ArrowLeft className="size-4" />
                                        Back to Signals
                                    </Link>
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="rounded-full border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium tracking-[0.18em] text-sky-700 uppercase"
                                            >
                                                {runKindLabel(displayRun.kind)}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.18em] uppercase',
                                                    statusBadgeClassName(
                                                        displayRun.status,
                                                    ),
                                                )}
                                            >
                                                {displayRun.status ===
                                                'running' ? (
                                                    <Loader2 className="size-3 animate-spin" />
                                                ) : displayRun.status ===
                                                  'completed' ? (
                                                    <CheckCircle2 className="size-3" />
                                                ) : displayRun.status ===
                                                  'failed' ? (
                                                    <CircleAlert className="size-3" />
                                                ) : (
                                                    <Sparkles className="size-3" />
                                                )}
                                                {displayRun.status}
                                            </Badge>
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                                                Run #{run.id.toString()}
                                            </h1>
                                            <p className="mt-2 max-w-3xl text-sm leading-6 text-pretty text-slate-600">
                                                {displayRun.summary ??
                                                    'Watching the Codex run in a cleaner, compact chat view while Reverb streams updates in real time.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid min-w-[16rem] gap-3 sm:grid-cols-2">
                                    <SummaryStat
                                        label="Requested"
                                        value={formatTimestamp(
                                            run.requested_at,
                                        )}
                                    />
                                    <SummaryStat
                                        label="Started"
                                        value={formatTimestamp(run.started_at)}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                                <div className="rounded-xl bg-slate-950 px-4 py-4 text-white shadow-lg shadow-slate-950/10">
                                    <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.22em] text-sky-200/80 uppercase">
                                        <MessageSquareText className="size-3.5" />
                                        Mission
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-slate-100">
                                        {run.prompt ??
                                            'Waiting for the run prompt to be attached.'}
                                    </p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <SummaryStat
                                        label="Assistant updates"
                                        value={assistantMessageCount.toString()}
                                    />
                                    <SummaryStat
                                        label="Milestones"
                                        value={milestoneCount.toString()}
                                    />
                                    <SummaryStat
                                        label="Tool steps"
                                        value={`${completedToolCount.toString()}/${toolActivities.length.toString()}`}
                                    />
                                    <SummaryStat
                                        label="Notices"
                                        value={errorCount.toString()}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
                        <Card className="gap-0 overflow-hidden rounded-xl border-slate-950/10 bg-white/90 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.32)]">
                            <CardHeader className="border-b border-slate-950/8 px-4 py-4 md:px-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-xl text-slate-950">
                                            Conversation
                                        </CardTitle>
                                        <CardDescription className="mt-1 text-sm text-slate-500">
                                            Assistant deltas are merged into a
                                            readable thread. Operational
                                            milestones stay lightweight in the
                                            same flow.
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                        <Clock3 className="size-3.5" />
                                        Live scroll enabled
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-4 py-5 md:px-5">
                                {timelineEvents.length > 0 ? (
                                    <div className="relative space-y-4">
                                        <div className="absolute top-0 bottom-0 left-6 w-px bg-gradient-to-b from-sky-100 via-slate-200 to-transparent" />
                                        {timelineEvents.map((event) => (
                                            <ThreadMessage
                                                key={event.id}
                                                event={event}
                                                isAssistant={
                                                    event.kind ===
                                                    'assistant_text'
                                                }
                                            />
                                        ))}
                                        <div ref={timelineEndRef} />
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-sm text-slate-500">
                                        Waiting for the local helper to claim
                                        this run and begin streaming activity.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <ToolWorkbench
                                toolActivities={toolActivities}
                                resolvedActiveToolIndex={
                                    resolvedActiveToolIndex
                                }
                                activeTool={activeTool}
                                isRunning={displayRun.status === 'running'}
                                onPrevious={showPreviousTool}
                                onNext={showNextTool}
                                onSelect={selectToolAt}
                            />

                            <ToolTrace
                                toolActivities={toolActivities}
                                activeToolIndex={resolvedActiveToolIndex}
                                running={displayRun.status === 'running'}
                                onSelect={selectToolAt}
                            />

                            <Card className="gap-0 overflow-hidden rounded-xl border-slate-950/10 bg-white/90 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.32)]">
                                <CardHeader className="border-b border-slate-950/8 px-5 py-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <CardTitle className="text-base text-slate-950">
                                                Stream Model
                                            </CardTitle>
                                            <CardDescription className="mt-1 text-sm text-slate-500">
                                                Reverb is streaming normalized
                                                message deltas, tool calls, tool
                                                results, and system notices into
                                                this workspace.
                                            </CardDescription>
                                        </div>
                                        <Workflow className="size-4 text-slate-400" />
                                    </div>
                                </CardHeader>
                                <CardContent className="px-5 py-5">
                                    <div className="grid gap-3 text-sm text-slate-600">
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                            Assistant deltas merge into single
                                            messages by `item_id`.
                                        </div>
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                            Tool calls stay compact by default
                                            and expand only when needed.
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <NoticesPanel noticeEvents={noticeEvents} />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
