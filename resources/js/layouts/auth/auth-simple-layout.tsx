import { Link } from '@inertiajs/react';
import { ArrowRight, ClipboardList, Radar, ShieldCheck } from 'lucide-react';
import {
    AdminMetric,
    AdminPill,
    AdminSurface,
    AdminSurfaceBody,
    AdminSurfaceHeader,
} from '@/components/admin-page';
import { BrandMark } from '@/components/brand-mark';
import { storeBrand } from '@/lib/brand';
import { home } from '@/routes/index';
import type { AuthLayoutProps } from '@/types';

const workflow = [
    {
        icon: Radar,
        title: 'Search signals',
        description: 'Find the review language worth acting on first.',
    },
    {
        icon: ClipboardList,
        title: 'Approve changes',
        description: 'Review proposals before anything reaches shoppers.',
    },
    {
        icon: ShieldCheck,
        title: 'Keep audit context',
        description: 'Track every run, decision, and publish step.',
    },
];

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.05),transparent_24%),linear-gradient(180deg,#f7f7f8_0%,#ffffff_30%,#fbfbfc_100%)]">
            <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(15,23,42,0.05),transparent)]" />
            <div className="absolute top-20 left-10 hidden size-40 rounded-full bg-sky-100 blur-3xl lg:block" />
            <div className="absolute right-8 bottom-12 hidden size-48 rounded-full bg-slate-200/70 blur-3xl lg:block" />

            <div className="mx-auto flex min-h-svh w-full max-w-6xl items-center px-4 py-8 md:px-6 md:py-10">
                <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_430px] lg:gap-8">
                    <div className="order-2 space-y-6 lg:order-1">
                        <div className="space-y-4">
                            <Link
                                href={home()}
                                className="inline-flex items-center gap-3 rounded-full border border-slate-950/8 bg-white/90 px-3 py-2 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.32)] backdrop-blur"
                            >
                                <BrandMark className="size-10 rounded-xl" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold tracking-tight text-slate-950">
                                        {storeBrand.adminName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {storeBrand.tagline}
                                    </p>
                                </div>
                            </Link>

                            <AdminPill className="bg-white/88 text-slate-500">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Live admin workspace
                            </AdminPill>

                            <div className="space-y-3">
                                <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                                    The same control room, before and after
                                    sign-in.
                                </h2>
                                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                    Signals should feel cohesive from the first
                                    credential prompt through proposal review,
                                    review search, and storefront verification.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <AdminMetric
                                label="Signals"
                                value="Search live review clusters"
                                detail="Use the same search-first workflow as the dashboard."
                            />
                            <AdminMetric
                                label="Queue"
                                value="Approve proposals with context"
                                detail="Review what changed, why it changed, and what ships next."
                            />
                            <AdminMetric
                                label="Audit"
                                value="Keep every run visible"
                                detail="Track helper status, human decisions, and published updates."
                            />
                        </div>

                        <AdminSurface>
                            <AdminSurfaceHeader
                                title="Operator flow"
                                description="Three steps the admin workspace is already optimized around."
                            />
                            <AdminSurfaceBody className="grid gap-3 md:grid-cols-3">
                                {workflow.map(
                                    ({
                                        icon: Icon,
                                        title: workflowTitle,
                                        description: workflowDescription,
                                    }) => (
                                        <div
                                            key={workflowTitle}
                                            className="rounded-lg border border-slate-950/7 bg-slate-50/80 px-4 py-4"
                                        >
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-950">
                                                <span className="flex size-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                                                    <Icon className="size-4" />
                                                </span>
                                                {workflowTitle}
                                            </div>
                                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                                {workflowDescription}
                                            </p>
                                            <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium tracking-[0.16em] text-slate-400 uppercase">
                                                Continue
                                                <ArrowRight className="size-3.5" />
                                            </div>
                                        </div>
                                    ),
                                )}
                            </AdminSurfaceBody>
                        </AdminSurface>
                    </div>

                    <div className="order-1 lg:order-2">
                        <AdminSurface className="overflow-hidden">
                            <AdminSurfaceHeader
                                title="Admin access"
                                description="Use an internal operator account to continue into Signals."
                                action={
                                    <AdminPill className="bg-slate-50 text-slate-500">
                                        <span className="size-1.5 rounded-full bg-slate-300" />
                                        Secure entry
                                    </AdminPill>
                                }
                            />
                            <AdminSurfaceBody className="p-6 sm:p-8">
                                <div className="flex flex-col gap-8">
                                    <div className="space-y-2">
                                        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                                            {title}
                                        </h1>
                                        <p className="text-sm leading-6 text-slate-500">
                                            {description}
                                        </p>
                                    </div>
                                    {children}
                                </div>
                            </AdminSurfaceBody>
                        </AdminSurface>
                    </div>
                </div>
            </div>
        </div>
    );
}
