import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { Bot, Check, CirclePlay, Copy, Radar } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
    AdminHeader,
    AdminPage,
    AdminPill,
    AdminSurface,
    AdminSurfaceBody,
} from '@/components/admin-page';
import { useClipboard } from '@/hooks/use-clipboard';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
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
        context: Record<string, unknown> | null;
        error_message?: string | null;
    } | null;
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

export default function Signals({
    filters,
    helper,
    latestRun,
}: SignalsPageProps) {
    return (
        <SignalsPage
            key={latestRun?.id ?? 'no-run'}
            filters={filters}
            helper={helper}
            latestRun={latestRun}
        />
    );
}

function SignalsPage({ filters, helper, latestRun }: SignalsPageProps) {
    const suggestedFocuses = [
        'Hoodie sizing complaints that should become one fit note proposal',
        'Negative shipping reviews that need one brand-safe response draft',
        'Softness praise on the Everyday Tee that could sharpen product copy',
    ];
    const helperHeartbeatEventName = '.signals-helper.heartbeat.updated';
    const { appUrl, auth, repositoryUrl } = usePage<PageProps>().props;
    const [query, setQuery] = useState(filters.q);
    const [helperLastSeenAt, setHelperLastSeenAt] = useState(
        helper.latest_device_seen_at,
    );
    const [helperLastSeenAtHuman, setHelperLastSeenAtHuman] = useState(
        helper.latest_device_seen_at_human,
    );
    const [copiedText, copy] = useClipboard();
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

    useEcho<HelperHeartbeatUpdatedEvent>(
        `signals.user.${auth.user.id}`,
        helperHeartbeatEventName,
        (payload) => {
            setHelperLastSeenAt(payload.last_seen_at);
            setHelperLastSeenAtHuman(payload.last_seen_at_human);
        },
        [auth.user.id],
    );

    const latestFocus =
        typeof latestRun?.context?.focus === 'string'
            ? latestRun.context.focus
            : null;
    const startSession = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const focus = query.trim();

        router.post(admin.reviewRuns.store().url, {
            kind: 'review_analysis',
            ...(focus !== '' ? { focus } : {}),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Session" />

            <AdminPage>
                <AdminHeader
                    eyebrow="Session"
                    title="Start one focused demo"
                    meta={
                        <>
                            <AdminPill
                                className={cn(
                                    needsHelperSetup
                                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                                        : 'border-emerald-200 bg-emerald-50 text-emerald-800',
                                )}
                            >
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
                            {latestRun ? (
                                <AdminPill
                                    className={runStatusClassName(
                                        latestRun.status,
                                    )}
                                >
                                    {latestRun.status}
                                </AdminPill>
                            ) : null}
                        </>
                    }
                />

                <AdminSurface>
                    <AdminSurfaceBody className="flex min-h-[calc(100dvh-15rem)] items-center justify-center px-6 py-8 md:px-10">
                        <div className="w-full max-w-3xl space-y-6">
                            <div className="space-y-4 text-center">
                                <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-slate-950/10 bg-slate-50 text-slate-500">
                                    {needsHelperSetup ? (
                                        <Bot className="size-6" />
                                    ) : (
                                        <Radar className="size-6" />
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-medium tracking-[0.22em] text-slate-400 uppercase">
                                        {needsHelperSetup
                                            ? 'Step 1 · Connect the helper'
                                            : 'Step 2 · Start the live session'}
                                    </p>
                                    <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                                        {needsHelperSetup
                                            ? 'Connect the helper once, then launch the demo from here.'
                                            : 'Start with one clear merchant problem, then jump straight into the full session.'}
                                    </h2>
                                    <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
                                        {needsHelperSetup
                                            ? 'This page stays focused on helper setup. The full streamed chat, tool calls, and run details live in their own session page once you start a run.'
                                            : 'No evidence rail, no review queue, no split-screen handoff. Starting the run sends you directly into the dedicated session chat.'}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-sm border border-slate-950/8 bg-slate-50/70 p-4 md:p-5">
                                {needsHelperSetup ? (
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-slate-950">
                                                    Bootstrap {helper.name}
                                                </p>
                                                <p className="text-sm leading-6 text-slate-500">
                                                    Copy the command, run it on
                                                    your machine, and leave this
                                                    page open until the helper
                                                    checks in.
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void copy(
                                                            helperBootstrapCommand,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-sm border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                                                >
                                                    {copiedText ===
                                                    helperBootstrapCommand ? (
                                                        <Check className="size-4" />
                                                    ) : (
                                                        <Copy className="size-4" />
                                                    )}
                                                    Copy command
                                                </button>
                                                <Link
                                                    href={
                                                        admin.helperToken.store()
                                                            .url
                                                    }
                                                    method="post"
                                                    as="button"
                                                    className="inline-flex items-center gap-2 rounded-sm border border-slate-950/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                                                >
                                                    Generate fresh token
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="rounded-sm border border-slate-950/8 bg-slate-950 p-4 text-slate-50">
                                            <code className="block overflow-x-auto text-xs leading-6 break-all whitespace-pre-wrap text-emerald-200">
                                                {helperBootstrapCommand}
                                            </code>
                                        </div>
                                    </div>
                                ) : (
                                    <form
                                        onSubmit={startSession}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
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
                                                rows={4}
                                                placeholder="Show me hoodie reviews about sizing and turn that pattern into one clear fit-note proposal."
                                                className="w-full rounded-sm border border-slate-950/10 bg-white px-4 py-3 text-sm leading-6 text-slate-900 transition outline-none placeholder:text-slate-400 focus:border-slate-950/20"
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {suggestedFocuses.map((focus) => (
                                                <button
                                                    key={focus}
                                                    type="button"
                                                    onClick={() =>
                                                        setQuery(focus)
                                                    }
                                                    className="rounded-full border border-slate-950/10 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-slate-950/20 hover:text-slate-700"
                                                >
                                                    {focus}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="submit"
                                                className="inline-flex items-center gap-2 rounded-sm bg-slate-950 px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                                            >
                                                <CirclePlay className="size-4" />
                                                Start demo session
                                            </button>
                                            {latestRun ? (
                                                <Link
                                                    href={
                                                        admin.reviewRuns.show(
                                                            latestRun.id,
                                                        ).url
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-sm border border-slate-950/10 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-950/20 hover:bg-slate-50"
                                                >
                                                    {latestRun.status ===
                                                    'running'
                                                        ? 'Resume live session'
                                                        : 'Open latest session'}
                                                </Link>
                                            ) : null}
                                        </div>
                                    </form>
                                )}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-sm border border-slate-950/8 bg-white px-4 py-4">
                                    <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                        Helper status
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span
                                            className={cn(
                                                'size-2 rounded-full',
                                                needsHelperSetup
                                                    ? 'bg-amber-400'
                                                    : 'bg-emerald-500',
                                            )}
                                        />
                                        <p className="text-sm font-medium text-slate-950">
                                            {needsHelperSetup
                                                ? 'Waiting for the helper to check in'
                                                : `${helper.name} is connected`}
                                        </p>
                                    </div>
                                    <p className="mt-1 text-sm leading-6 text-slate-500">
                                        {needsHelperSetup
                                            ? 'As soon as the helper is online, this launcher becomes a single prompt composer for the session.'
                                            : `Last heartbeat ${helperLastSeenAtHuman ?? 'just now'}.`}
                                    </p>
                                </div>

                                <div className="rounded-sm border border-slate-950/8 bg-white px-4 py-4">
                                    <p className="text-[10px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                        Latest session
                                    </p>
                                    {latestRun ? (
                                        <div className="mt-2 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <AdminPill
                                                    className={runStatusClassName(
                                                        latestRun.status,
                                                    )}
                                                >
                                                    {latestRun.status}
                                                </AdminPill>
                                            </div>
                                            <p className="text-sm font-medium text-slate-950">
                                                {latestFocus ??
                                                    latestRun.summary ??
                                                    'Signals session'}
                                            </p>
                                            <p className="text-sm leading-6 text-slate-500">
                                                {latestRun.error_message ??
                                                    'Open the dedicated session page to review the full assistant transcript and tool trace.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            Starting a run opens the full chat
                                            page automatically, with the tool
                                            calls embedded inline and scrolled
                                            to the latest activity.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </AdminSurfaceBody>
                </AdminSurface>
            </AdminPage>
        </AppLayout>
    );
}
