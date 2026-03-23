import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { login } from '@/routes';

interface ProductCard {
    id: number;
    name: string;
    slug: string;
    category: string;
    price_cents: number;
    hero_image_url: string;
    short_description: string;
    fit_note: string | null;
    review_count: number;
    average_rating: number;
}

export default function StorefrontIndex({
    products,
}: {
    products: ProductCard[];
}) {
    return (
        <>
            <Head title="ReviewOps Storefront" />
            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#fff7ed_45%,_#ffffff_100%)] text-slate-900">
                <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
                    <header className="flex items-center justify-between">
                        <Link href="/" className="text-lg font-semibold tracking-tight">
                            ReviewOps
                        </Link>
                        <div className="flex items-center gap-3">
                            <Link
                                href={login()}
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                            >
                                Admin Login
                            </Link>
                        </div>
                    </header>

                    <section className="grid gap-10 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-white/80 px-3 py-1 text-sm text-amber-900 shadow-sm">
                                <Sparkles className="size-4" />
                                Human-approved merchandising updates powered by Codex
                            </div>
                            <div className="space-y-4">
                                <h1 className="max-w-4xl font-serif text-5xl leading-tight tracking-tight lg:text-7xl">
                                    Apparel pages that learn from what customers actually say.
                                </h1>
                                <p className="max-w-2xl text-lg leading-8 text-slate-600">
                                    This storefront is paired with an internal ReviewOps console. The merchant team reviews AI-prepared proposals before changes go live, so every update stays visible and accountable.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm">
                                    <ShieldCheck className="size-4 text-emerald-600" />
                                    Human approval required
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm">
                                    <Star className="size-4 text-amber-500" />
                                    Realistic seeded products and reviews
                                </div>
                            </div>
                        </div>
                        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
                            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
                                Demo Loop
                            </p>
                            <div className="mt-5 space-y-4 text-sm text-slate-700">
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    1. Merchant searches hoodie reviews about sizing.
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    2. Codex finds a repeated fit issue and prepares a proposal.
                                </div>
                                <div className="rounded-2xl bg-amber-50 p-4 text-amber-950">
                                    3. After approval, the storefront shows a fit note live on the product page.
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-6 pb-16 md:grid-cols-2 xl:grid-cols-4">
                        {products.map((product) => (
                            <Link
                                key={product.id}
                                href={`/products/${product.slug}`}
                                className="group overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]"
                            >
                                <div className="aspect-[4/5] overflow-hidden bg-slate-100">
                                    <img
                                        src={product.hero_image_url}
                                        alt={product.name}
                                        className="size-full object-cover transition duration-500 group-hover:scale-105"
                                    />
                                </div>
                                <div className="space-y-4 p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                                {product.category}
                                            </p>
                                            <h2 className="mt-2 text-xl font-semibold">
                                                {product.name}
                                            </h2>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-900">
                                            ${(product.price_cents / 100).toFixed(2)}
                                        </span>
                                    </div>
                                    <p className="text-sm leading-6 text-slate-600">
                                        {product.short_description}
                                    </p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">
                                            {product.average_rating.toFixed(1)} stars · {product.review_count} reviews
                                        </span>
                                        <span className="inline-flex items-center gap-1 font-medium text-slate-900">
                                            View product
                                            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                                        </span>
                                    </div>
                                    {product.fit_note && (
                                        <div className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-950">
                                            {product.fit_note}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </section>
                </div>
            </div>
        </>
    );
}
