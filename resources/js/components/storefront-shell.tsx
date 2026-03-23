import { Head, Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { BrandMark } from '@/components/brand-mark';
import { storeBrand } from '@/lib/brand';
import { dashboard, login } from '@/routes/index';

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

            <div className="isolate min-h-dvh bg-white font-['Manrope',sans-serif] text-slate-950 antialiased">
                <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
                    <header className="flex items-center justify-between gap-4 border-b border-slate-950/10 py-5">
                        <a
                            href="/"
                            aria-label="Homepage"
                            className="inline-flex items-center gap-3"
                        >
                            <BrandMark />
                            <span className="text-base font-semibold tracking-tight text-slate-950">
                                {storeBrand.name}
                            </span>
                        </a>

                        <nav className="flex items-center gap-6 text-sm">
                            <Link
                                href="/"
                                className="text-slate-500 hover:text-slate-950"
                            >
                                Collection
                            </Link>
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-sm bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                                >
                                    Dashboard
                                </Link>
                            ) : null}
                        </nav>
                    </header>

                    <main>{children}</main>

                    <footer className="mt-16 border-t border-slate-950/10 py-8">
                        <div className="flex flex-col gap-2 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
                            <p>
                                © {new Date().getFullYear()} {storeBrand.name}{' '}
                                &middot; {storeBrand.collection}
                            </p>
                            {!auth.user ? (
                                <Link
                                    href={login()}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    Team login
                                </Link>
                            ) : null}
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}
