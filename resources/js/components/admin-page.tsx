import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AdminPage({
    children,
    className,
    ...props
}: ComponentPropsWithoutRef<'div'>) {
    return (
        <div
            className={cn(
                'mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-4 md:px-6 md:py-6',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function AdminHeader({
    eyebrow,
    title,
    description,
    actions,
    meta,
}: {
    eyebrow?: string;
    title: string;
    description: ReactNode;
    actions?: ReactNode;
    meta?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-4 border-b border-slate-950/6 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
                {eyebrow ? (
                    <p className="text-[11px] font-medium tracking-[0.22em] text-slate-400 uppercase">
                        {eyebrow}
                    </p>
                ) : null}
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                        {title}
                    </h1>
                    <div className="max-w-3xl text-sm leading-6 text-slate-600">
                        {description}
                    </div>
                </div>
                {meta ? (
                    <div className="flex flex-wrap gap-2">{meta}</div>
                ) : null}
            </div>
            {actions ? (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            ) : null}
        </div>
    );
}

export function AdminSurface({
    children,
    className,
}: ComponentPropsWithoutRef<'section'>) {
    return (
        <section
            className={cn(
                'rounded-xl border border-slate-950/8 bg-white/92 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.32)] backdrop-blur',
                className,
            )}
        >
            {children}
        </section>
    );
}

export function AdminSurfaceHeader({
    title,
    description,
    action,
    className,
}: {
    title: string;
    description?: ReactNode;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-start justify-between gap-3 border-b border-slate-950/6 px-4 py-3',
                className,
            )}
        >
            <div>
                <h2 className="text-sm font-semibold text-slate-950">
                    {title}
                </h2>
                {description ? (
                    <div className="mt-1 text-sm leading-5 text-slate-500">
                        {description}
                    </div>
                ) : null}
            </div>
            {action}
        </div>
    );
}

export function AdminSurfaceBody({
    children,
    className,
}: ComponentPropsWithoutRef<'div'>) {
    return <div className={cn('px-4 py-4', className)}>{children}</div>;
}

export function AdminMetric({
    label,
    value,
    detail,
    className,
}: {
    label: string;
    value: ReactNode;
    detail?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'rounded-lg border border-slate-950/7 bg-slate-50/80 px-4 py-3',
                className,
            )}
        >
            <p className="text-[11px] font-medium tracking-[0.2em] text-slate-400 uppercase">
                {label}
            </p>
            <div className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                {value}
            </div>
            {detail ? (
                <div className="mt-1 text-xs leading-5 text-slate-500">
                    {detail}
                </div>
            ) : null}
        </div>
    );
}

export function AdminPill({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 rounded-full border border-slate-950/8 bg-white px-2.5 py-1 text-[11px] font-medium tracking-[0.16em] text-slate-500 uppercase',
                className,
            )}
        >
            {children}
        </span>
    );
}
