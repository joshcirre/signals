import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ShieldCheck, Star } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { storeBrand } from '@/lib/brand';

interface ProductPageData {
    id: number;
    name: string;
    slug: string;
    category: string;
    price_cents: number;
    hero_image_url: string;
    short_description: string;
    description: string;
    fit_note: string | null;
    faq_items: Array<{ question: string; answer: string }>;
    average_rating: number;
    review_count: number;
}

interface ReviewData {
    id: number;
    author_name: string;
    rating: number;
    title: string | null;
    body: string;
    reviewed_at: string | null;
}

export default function StorefrontShow({
    product,
    reviews,
}: {
    product: ProductPageData;
    reviews: ReviewData[];
}) {
    return (
        <>
            <Head title={`${product.name} · ${storeBrand.name}`} />
            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#cfe9ff_0%,_transparent_28%),linear-gradient(180deg,_#f9fbff_0%,_#f5f1e8_42%,_#ffffff_100%)] text-slate-900">
                <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                        >
                            <ArrowLeft className="size-4" />
                            Back to products
                        </Link>
                        <div className="inline-flex items-center gap-3">
                            <BrandMark className="size-9 rounded-2xl" />
                            <div className="text-right">
                                <p className="text-sm font-semibold text-slate-950">
                                    {storeBrand.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {storeBrand.shopperTagline}
                                </p>
                            </div>
                        </div>
                    </div>

                    <section className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                        <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
                            <img
                                src={product.hero_image_url}
                                alt={product.name}
                                className="aspect-[4/5] size-full object-cover"
                            />
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <p className="text-xs tracking-[0.25em] text-slate-500 uppercase">
                                    {product.category}
                                </p>
                                <h1 className="font-serif text-5xl leading-tight tracking-tight">
                                    {product.name}
                                </h1>
                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                    <span className="inline-flex items-center gap-1">
                                        <Star className="size-4 fill-amber-400 text-amber-400" />
                                        {product.average_rating.toFixed(1)}{' '}
                                        average
                                    </span>
                                    <span>
                                        {product.review_count} customer reviews
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-end justify-between gap-4 rounded-[1.75rem] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                                <div>
                                    <p className="text-sm text-slate-500">
                                        Price
                                    </p>
                                    <p className="mt-2 text-3xl font-semibold">
                                        $
                                        {(product.price_cents / 100).toFixed(2)}
                                    </p>
                                </div>
                                <div className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white">
                                    Add to cart
                                </div>
                            </div>

                            <p className="text-lg leading-8 text-slate-600">
                                {product.description}
                            </p>

                            {product.fit_note ? (
                                <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-sm">
                                    <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.2em] uppercase">
                                        <ShieldCheck className="size-4" />
                                        Shopper Guidance
                                    </div>
                                    <p className="mt-3 text-base leading-7">
                                        {product.fit_note}
                                    </p>
                                </div>
                            ) : null}
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/82 p-4 shadow-sm">
                                    <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                                        Collection
                                    </p>
                                    <p className="mt-2 text-lg font-semibold text-slate-950">
                                        {storeBrand.collection}
                                    </p>
                                </div>
                                <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/82 p-4 shadow-sm">
                                    <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                                        Guidance model
                                    </p>
                                    <p className="mt-2 text-lg font-semibold text-slate-950">
                                        Review-informed fit note
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mt-14 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-5">
                            <h2 className="text-2xl font-semibold">
                                Customer reviews
                            </h2>
                            {reviews.map((review) => (
                                <article
                                    key={review.id}
                                    className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-medium">
                                                {review.author_name}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {review.reviewed_at}
                                            </p>
                                        </div>
                                        <div className="text-sm font-medium text-slate-700">
                                            {review.rating}/5
                                        </div>
                                    </div>
                                    {review.title ? (
                                        <h3 className="mt-4 text-lg font-semibold">
                                            {review.title}
                                        </h3>
                                    ) : null}
                                    <p className="mt-2 leading-7 text-slate-600">
                                        {review.body}
                                    </p>
                                </article>
                            ))}
                        </div>

                        <div className="space-y-5">
                            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-semibold">
                                    Why this page changes
                                </h2>
                                <p className="mt-3 leading-7 text-slate-600">
                                    Merchant-facing updates in ReviewOps are
                                    prepared by Codex but only go live after
                                    human approval. This product page is the
                                    visible before-and-after surface for that
                                    workflow.
                                </p>
                            </div>

                            {product.faq_items.length > 0 ? (
                                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                                    <h2 className="text-xl font-semibold">
                                        FAQ
                                    </h2>
                                    <div className="mt-4 space-y-4">
                                        {product.faq_items.map((faq) => (
                                            <div key={faq.question}>
                                                <h3 className="font-medium">
                                                    {faq.question}
                                                </h3>
                                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
