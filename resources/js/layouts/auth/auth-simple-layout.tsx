import { Link } from '@inertiajs/react';
import { BrandMark } from '@/components/brand-mark';
import { storeBrand } from '@/lib/brand';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#dbeafe_0%,transparent_24%),linear-gradient(180deg,#f8fbff_0%,#f3efe6_48%,#ffffff_100%)] p-6 md:p-10">
            <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(17,32,49,0.08),transparent)]" />
            <div className="absolute top-16 left-12 hidden size-36 rounded-full bg-sky-200/30 blur-3xl lg:block" />
            <div className="absolute right-12 bottom-16 hidden size-40 rounded-full bg-amber-200/35 blur-3xl lg:block" />
            <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr_0.65fr]">
                <div className="hidden rounded-[2.5rem] border border-white/70 bg-[linear-gradient(145deg,#112031_0%,#1e3a5f_52%,#0ea5e9_100%)] p-10 text-white shadow-[0_34px_100px_rgba(17,32,49,0.24)] lg:flex lg:flex-col lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm tracking-[0.22em] text-white/78 uppercase">
                            <BrandMark className="size-8 rounded-xl shadow-none" />
                            {storeBrand.name}
                        </div>
                        <h2 className="mt-8 max-w-xl text-5xl leading-tight font-semibold tracking-tight">
                            Review intelligence with a merchant-friendly control
                            layer.
                        </h2>
                        <p className="mt-6 max-w-xl text-lg leading-8 text-white/78">
                            Surface hidden patterns, stream Codex work in real
                            time, and approve only the changes you want shoppers
                            to see.
                        </p>
                    </div>
                    <div className="grid gap-3 text-sm text-white/78">
                        <div className="rounded-2xl border border-white/12 bg-white/10 px-5 py-4">
                            Search review language beyond raw keywords.
                        </div>
                        <div className="rounded-2xl border border-white/12 bg-white/10 px-5 py-4">
                            Draft fit notes and response proposals through MCP
                            tools.
                        </div>
                        <div className="rounded-2xl border border-white/12 bg-white/10 px-5 py-4">
                            Keep every agent and human action visible in the
                            audit log.
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    <div className="mx-auto max-w-md rounded-[2.25rem] border border-white/80 bg-white/88 p-8 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur">
                        <div className="flex flex-col gap-8">
                            <div className="flex flex-col items-center gap-5">
                                <Link
                                    href={home()}
                                    className="flex flex-col items-center gap-3 font-medium"
                                >
                                    <BrandMark className="size-12 rounded-2xl" />
                                    <div className="text-center">
                                        <p className="text-base font-semibold tracking-tight text-slate-950">
                                            {storeBrand.adminName}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {storeBrand.tagline}
                                        </p>
                                    </div>
                                </Link>

                                <div className="space-y-2 text-center">
                                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                                        {title}
                                    </h1>
                                    <p className="text-center text-sm leading-6 text-slate-500">
                                        {description}
                                    </p>
                                </div>
                            </div>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
