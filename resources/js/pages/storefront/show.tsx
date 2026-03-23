import { Link } from '@inertiajs/react';
import { ArrowLeft, ShieldCheck, Star, Tag } from 'lucide-react';
import { StorefrontShell } from '@/components/storefront-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
        <StorefrontShell title={`${product.name} · ${storeBrand.name}`}>
            <section className="pt-10">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
                >
                    <ArrowLeft className="size-4" />
                    Back to the collection
                </Link>
            </section>

            <section className="grid gap-8 pt-6 pb-12 lg:grid-cols-[1.02fr_0.98fr]">
                <div className="space-y-5">
                    <div className="overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                        <img
                            src={product.hero_image_url}
                            alt={product.name}
                            className="aspect-[4/5] size-full object-cover"
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[1.8rem] border border-white/80 bg-white/84 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                            <p className="text-sm text-slate-500">Collection</p>
                            <p className="mt-3 text-xl font-semibold text-slate-950">
                                {storeBrand.collection}
                            </p>
                        </div>
                        <div className="rounded-[1.8rem] border border-white/80 bg-white/84 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                            <p className="text-sm text-slate-500">
                                Review signal
                            </p>
                            <p className="mt-3 text-xl font-semibold text-slate-950">
                                {product.review_count} recent shopper notes
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 lg:pt-6">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <p className="text-xs tracking-[0.28em] text-slate-500 uppercase">
                                {product.category}
                            </p>
                            <Badge
                                variant="outline"
                                className="rounded-full border-slate-300 bg-white/75 px-3 py-1 text-[0.7rem] tracking-[0.2em] text-slate-600 uppercase"
                            >
                                <Tag className="size-3.5" />
                                Product page
                            </Badge>
                        </div>
                        <h1 className="text-5xl leading-[0.96] tracking-tight text-slate-950 [font-family:'Fraunces',serif] lg:text-7xl">
                            {product.name}
                        </h1>
                        <p className="max-w-2xl text-lg leading-8 text-slate-600">
                            {product.description}
                        </p>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="text-sm text-slate-500">Price</p>
                                <p className="mt-2 text-4xl font-semibold text-slate-950">
                                    ${(product.price_cents / 100).toFixed(2)}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span className="inline-flex items-center gap-2">
                                    <Star className="size-4 fill-amber-400 text-amber-400" />
                                    {product.average_rating.toFixed(1)} average
                                </span>
                                <span>{product.review_count} reviews</span>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button
                                size="lg"
                                className="rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800"
                            >
                                Add to cart
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="rounded-full border-slate-300 bg-white/80 px-6"
                            >
                                Save for later
                            </Button>
                        </div>
                    </div>

                    {product.fit_note ? (
                        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-[0_16px_40px_rgba(180,83,9,0.08)]">
                            <div className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.24em] uppercase">
                                <ShieldCheck className="size-4" />
                                Shopper guidance
                            </div>
                            <p className="mt-4 text-base leading-8">
                                {product.fit_note}
                            </p>
                        </div>
                    ) : null}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[1.8rem] border border-white/80 bg-white/84 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                            <p className="text-sm text-slate-500">
                                Guidance model
                            </p>
                            <p className="mt-3 text-xl font-semibold text-slate-950">
                                Review-informed fit note
                            </p>
                        </div>
                        <div className="rounded-[1.8rem] border border-white/80 bg-white/84 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                            <p className="text-sm text-slate-500">
                                Signals workflow
                            </p>
                            <p className="mt-3 text-xl font-semibold text-slate-950">
                                Proposed by Codex, approved by an operator
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-8 pb-8 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="space-y-5">
                    <div>
                        <p className="text-sm font-medium tracking-[0.24em] text-slate-500 uppercase">
                            Customer reviews
                        </p>
                        <h2 className="mt-3 text-4xl tracking-tight text-slate-950 [font-family:'Fraunces',serif]">
                            What shoppers actually noticed.
                        </h2>
                    </div>

                    <div className="grid gap-4">
                        {reviews.map((review) => (
                            <article
                                key={review.id}
                                className="rounded-[1.9rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-semibold text-slate-950">
                                            {review.author_name}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {review.reviewed_at}
                                        </p>
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                                        <Star className="size-4 fill-amber-400 text-amber-400" />
                                        {review.rating}/5
                                    </div>
                                </div>
                                {review.title ? (
                                    <h3 className="mt-4 text-2xl tracking-tight text-slate-950 [font-family:'Fraunces',serif]">
                                        {review.title}
                                    </h3>
                                ) : null}
                                <p className="mt-3 leading-7 text-slate-600">
                                    {review.body}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(145deg,_rgba(15,23,42,0.96)_0%,_rgba(24,24,27,0.92)_42%,_rgba(15,118,110,0.86)_100%)] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
                        <p className="text-sm font-medium tracking-[0.24em] text-white/60 uppercase">
                            Why this page changes
                        </p>
                        <h2 className="mt-4 text-3xl tracking-tight [font-family:'Fraunces',serif]">
                            Signals keeps the shopper surface simple.
                        </h2>
                        <p className="mt-4 leading-7 text-white/75">
                            Merchants review proposals in the admin console, approve
                            the best one, and the result shows up here as a clearer
                            fit note or FAQ. The customer never sees the internal
                            tooling, only the improved product page.
                        </p>
                    </div>

                    {product.faq_items.length > 0 ? (
                        <div className="rounded-[2rem] border border-slate-200/80 bg-white/88 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                            <p className="text-sm font-medium tracking-[0.24em] text-slate-500 uppercase">
                                FAQ
                            </p>
                            <div className="mt-4 space-y-4">
                                {product.faq_items.map((faq) => (
                                    <div
                                        key={faq.question}
                                        className="rounded-[1.5rem] bg-slate-50 px-4 py-4"
                                    >
                                        <h3 className="font-semibold text-slate-950">
                                            {faq.question}
                                        </h3>
                                        <p className="mt-2 text-sm leading-7 text-slate-600">
                                            {faq.answer}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </section>
        </StorefrontShell>
    );
}
