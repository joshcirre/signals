import { Head } from '@inertiajs/react';
import { Bot, ShieldCheck, TerminalSquare } from 'lucide-react';
import {
    AdminHeader,
    AdminMetric,
    AdminPage,
    AdminPill,
    AdminSurface,
    AdminSurfaceBody,
    AdminSurfaceHeader,
} from '@/components/admin-page';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import { dashboard } from '@/routes/index';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: dashboard(),
    },
    {
        title: 'Audit Log',
        href: admin.auditLog(),
    },
];

interface AuditLogPageProps {
    entries: Array<{
        id: number;
        action: string;
        actor_type: string;
        target_type: string | null;
        target_id: number | null;
        metadata: Record<string, unknown>;
        created_at: string;
    }>;
}

const actorIcons = {
    agent: Bot,
    human: ShieldCheck,
    system: TerminalSquare,
} as const;

export default function AuditLog({ entries }: AuditLogPageProps) {
    const agentCount = entries.filter(
        (entry) => entry.actor_type === 'agent',
    ).length;
    const humanCount = entries.filter(
        (entry) => entry.actor_type === 'human',
    ).length;
    const systemCount = entries.filter(
        (entry) => entry.actor_type === 'system',
    ).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Log" />

            <AdminPage>
                <AdminHeader
                    eyebrow="System history"
                    title="Audit log"
                    meta={
                        <AdminPill>
                            <span className="size-1.5 rounded-full bg-slate-300" />
                            {entries.length} total events
                        </AdminPill>
                    }
                />

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <AdminMetric
                        label="Total"
                        value={entries.length}
                        detail="Events in this feed."
                    />
                    <AdminMetric
                        label="Agent"
                        value={agentCount}
                        detail="Automated decisions and tool activity."
                    />
                    <AdminMetric
                        label="Human"
                        value={humanCount}
                        detail="Operator review and approval actions."
                    />
                    <AdminMetric
                        label="System"
                        value={systemCount}
                        detail="Platform or runtime messages."
                    />
                </div>

                <AdminSurface>
                    <AdminSurfaceHeader title="Event timeline" />
                    <AdminSurfaceBody className="space-y-0 p-0">
                        {entries.length > 0 ? (
                            entries.map((entry, index) => {
                                const Icon =
                                    actorIcons[
                                        entry.actor_type as keyof typeof actorIcons
                                    ] ?? TerminalSquare;
                                const metadata = Object.fromEntries(
                                    Object.entries(entry.metadata).filter(
                                        ([key]) => key !== 'message',
                                    ),
                                );
                                const hasMetadata =
                                    Object.keys(metadata).length > 0;

                                return (
                                    <article
                                        key={entry.id}
                                        className={`px-4 py-4 ${
                                            index === 0
                                                ? ''
                                                : 'border-t border-slate-950/6'
                                        }`}
                                    >
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="flex min-w-0 gap-3">
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-slate-950/8 bg-slate-50 text-slate-500">
                                                    <Icon className="size-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-sm font-medium text-slate-950">
                                                            {entry.action}
                                                        </p>
                                                        <span className="rounded-sm bg-slate-100 px-2 py-1 text-[11px] font-medium tracking-[0.16em] text-slate-500 uppercase">
                                                            {entry.actor_type}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-sm leading-6 text-slate-500">
                                                        {String(
                                                            entry.metadata
                                                                .message ??
                                                                'No message recorded.',
                                                        )}
                                                    </p>
                                                    {entry.target_type &&
                                                    entry.target_id ? (
                                                        <p className="mt-2 text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                            {entry.target_type}{' '}
                                                            #{entry.target_id}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="shrink-0 text-xs text-slate-400">
                                                {new Date(
                                                    entry.created_at,
                                                ).toLocaleString()}
                                            </div>
                                        </div>

                                        {hasMetadata ? (
                                            <details className="mt-3 rounded-sm border border-slate-950/8 bg-slate-50/80 px-3 py-3 text-sm text-slate-600">
                                                <summary className="cursor-pointer list-none text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">
                                                    Structured metadata
                                                </summary>
                                                <pre className="mt-3 overflow-x-auto text-xs leading-5 break-words whitespace-pre-wrap text-slate-600">
                                                    {JSON.stringify(
                                                        metadata,
                                                        null,
                                                        2,
                                                    )}
                                                </pre>
                                            </details>
                                        ) : null}
                                    </article>
                                );
                            })
                        ) : (
                            <div className="px-4 py-8 text-sm leading-6 text-slate-500">
                                Audit events will appear here once the next
                                action is recorded.
                            </div>
                        )}
                    </AdminSurfaceBody>
                </AdminSurface>
            </AdminPage>
        </AppLayout>
    );
}
