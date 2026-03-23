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
            <div className="space-y-8 p-4 md:p-6">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Governance</p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                                Every Codex and human action stays visible.
                            </h1>
                        </div>
                        <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                            {entries.length} recent events
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    {entries.map((entry) => {
                        const Icon = actorIcons[entry.actor_type as keyof typeof actorIcons] ?? TerminalSquare;

                        return (
                            <article
                                key={entry.id}
                                className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                                            <Icon className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                                                {entry.actor_type}
                                            </p>
                                            <h2 className="mt-2 text-lg font-semibold text-slate-950">
                                                {entry.action}
                                            </h2>
                                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                                                {String(entry.metadata.message ?? 'No message recorded.')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right text-sm text-slate-500">
                                        <p>{new Date(entry.created_at).toLocaleString()}</p>
                                        {entry.target_type && entry.target_id ? (
                                            <p className="mt-1">
                                                {entry.target_type} #{entry.target_id}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>

                                {Object.entries(entry.metadata).filter(([key]) => key !== 'message').length > 0 ? (
                                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                                        <pre className="overflow-x-auto whitespace-pre-wrap break-words">
                                            {JSON.stringify(
                                                Object.fromEntries(
                                                    Object.entries(entry.metadata).filter(([key]) => key !== 'message'),
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
