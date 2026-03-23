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
                'mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-4 md:px-6 md:py-5',
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
    actions,
    meta,
}: {
    eyebrow?: string;
    title: string;
    actions?: ReactNode;
    meta?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2 border-b border-slate-950/6 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
                {eyebrow ? (
                    <p className="text-[10px] font-medium tracking-[0.22em] text-slate-400 uppercase">
                        {eyebrow}
                    </p>
                ) : null}
                <h1 className="text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">
                    {title}
                </h1>
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
                'rounded-sm border border-slate-950/7 bg-white',
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
                'rounded-sm border border-slate-950/7 bg-slate-50 px-3.5 py-3',
                className,
            )}
        >
            <p className="text-[10px] font-medium tracking-[0.2em] text-slate-400 uppercase">
                {label}
            </p>
            <div className="mt-1.5 text-base font-semibold tracking-tight text-slate-950 md:text-lg">
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
                'inline-flex items-center gap-2 rounded-sm border border-slate-950/8 bg-white px-2.5 py-1 text-[10px] font-medium tracking-[0.16em] text-slate-500 uppercase',
                className,
            )}
        >
            {children}
        </span>
    );
}
