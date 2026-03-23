import { Head } from '@inertiajs/react';
import { Bot, ShieldCheck, TerminalSquare } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
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
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Log" />
            <div className="space-y-4 p-4 md:p-5">
                {/* Page header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-sm font-semibold text-slate-950">
                            Audit log
                        </h1>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Every Codex and human action, recorded.
                        </p>
                    </div>
                    <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                        {entries.length} events
                    </span>
                </div>

                {/* Entries */}
                <section className="space-y-2">
                    {entries.map((entry) => {
                        const Icon =
                            actorIcons[
                                entry.actor_type as keyof typeof actorIcons
                            ] ?? TerminalSquare;

                        return (
                            <article
                                key={entry.id}
                                className="rounded-lg border border-slate-950/10 bg-white p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
                                        <div>
                                            <p className="text-xs text-slate-400">
                                                {entry.actor_type}
                                            </p>
                                            <h2 className="mt-0.5 text-sm font-medium text-slate-950">
                                                {entry.action}
                                            </h2>
                                            <p className="mt-1 max-w-3xl text-sm text-pretty text-slate-500">
                                                {String(
                                                    entry.metadata.message ??
                                                        'No message recorded.',
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-slate-400">
                                        <p>
                                            {new Date(
                                                entry.created_at,
                                            ).toLocaleString()}
                                        </p>
                                        {entry.target_type &&
                                        entry.target_id ? (
                                            <p className="mt-1">
                                                {entry.target_type} #
                                                {entry.target_id}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>

                                {Object.entries(entry.metadata).filter(
                                    ([key]) => key !== 'message',
                                ).length > 0 ? (
                                    <div className="mt-3 rounded bg-slate-50 p-3 text-xs text-slate-600">
                                        <pre className="overflow-x-auto break-words whitespace-pre-wrap">
                                            {JSON.stringify(
                                                Object.fromEntries(
                                                    Object.entries(
                                                        entry.metadata,
                                                    ).filter(
                                                        ([key]) =>
                                                            key !== 'message',
                                                    ),
                                                ),
                                                null,
                                                2,
                                            )}
                                        </pre>
                                    </div>
                                ) : null}
                            </article>
                        );
                    })}
                </section>
            </div>
        </AppLayout>
    );
}
