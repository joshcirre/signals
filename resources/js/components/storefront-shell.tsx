import { Head, Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, ShoppingBag, Sparkles } from 'lucide-react';
import { ReactNode } from 'react';
import { BrandMark } from '@/components/brand-mark';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { storeBrand } from '@/lib/brand';
import { dashboard, login } from '@/routes';

interface SharedPageProps {
    auth: {
        user: {
            id: number;
        } | null;
    };
    [key: string]: unknown;
}

interface StorefrontShellProps {
    title: string;
    children: ReactNode;
}

export function StorefrontShell({ title, children }: StorefrontShellProps) {
    const { auth } = usePage<SharedPageProps>().props;

    return (
        <>
            <Head title={title}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=fraunces:400,500,600,700|manrope:400,500,600,700,800"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-[#f4efe6] text-slate-950 [font-family:'Manrope',sans-serif]">
                <div className="relative isolate overflow-hidden">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.16),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(191,219,254,0.8),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,0.92)_0%,_rgba(244,239,230,0.7)_58%,_rgba(244,239,230,1)_100%)]" />
                    <div className="pointer-events-none absolute inset-x-0 top-28 h-px bg-gradient-to-r from-transparent via-slate-300/70 to-transparent" />
                    <div className="pointer-events-none absolute top-32 left-[8%] size-56 rounded-full bg-emerald-200/30 blur-3xl" />
                    <div className="pointer-events-none absolute top-24 right-[10%] size-64 rounded-full bg-sky-200/40 blur-3xl" />

                    <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 sm:px-6 lg:px-10">
                        <header className="rounded-full border border-white/70 bg-white/72 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <Link href="/" className="inline-flex items-center gap-3">
                                    <BrandMark />
                                    <div>
                                        <p className="text-sm font-semibold tracking-[0.24em] text-slate-500 uppercase">
                                            Signals demo
                                        </p>
                                        <p className="text-lg font-semibold tracking-tight text-slate-950">
                                            {storeBrand.name}
                                        </p>
                                    </div>
                                </Link>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="rounded-full border-slate-200 bg-white/80 px-3 py-1 text-[0.68rem] tracking-[0.22em] text-slate-600 uppercase"
                                    >
                                        <Sparkles className="size-3.5" />
                                        Live shopper surface
                                    </Badge>
                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="rounded-full text-slate-700 hover:bg-white hover:text-slate-950"
                                    >
                                        <Link href="/">
                                            <ShoppingBag className="size-4" />
                                            Storefront
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        className="rounded-full bg-slate-950 px-5 text-white hover:bg-slate-800"
                                    >
                                        <Link href={auth.user ? dashboard() : login()}>
                                            <LayoutDashboard className="size-4" />
                                            {auth.user ? 'Open Signals' : 'Admin Login'}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </header>

                        <main className="flex-1">{children}</main>

                        <footer className="mt-16 border-t border-slate-300/70 py-6">
                            <div className="flex flex-col gap-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                                <p>
                                    Signals pairs a hosted Laravel storefront with a local
                                    Codex helper, MCP tools, and a human approval layer.
                                </p>
                                <Link
                                    href={auth.user ? dashboard() : login()}
                                    className="inline-flex items-center gap-2 font-medium text-slate-950 transition hover:text-slate-700"
                                >
                                    {auth.user ? 'Open Signals' : 'Open admin flow'}
                                </Link>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </>
    );
}
