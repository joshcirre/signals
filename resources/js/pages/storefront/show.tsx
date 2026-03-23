import { Link } from '@inertiajs/react';
import { ArrowLeft, Star } from 'lucide-react';
import { StorefrontShell } from '@/components/storefront-shell';
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
    approved_response: string | null;
    response_approved_at: string | null;
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
            <section className="pt-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-950"
                >
                    <ArrowLeft className="size-4" />
                    Back to collection
                </Link>
            </section>

            {/* Product detail */}
            <section className="grid gap-12 pt-8 pb-16 lg:grid-cols-2">
                <div>
                    <div className="overflow-hidden rounded-md border border-slate-950/10 bg-gray-50">
                        <img
                            src={product.hero_image_url}
                            alt={product.name}
                            className="aspect-[4/5] size-full object-cover"
                        />
                    </div>
                </div>

                <div className="space-y-6 lg:pt-2">
                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            {product.category}
                        </p>
                        <h1 className="mt-3 max-w-[30ch] font-['Fraunces',serif] text-5xl tracking-tight text-balance text-slate-950 lg:max-w-[24ch] lg:text-6xl">
                            {product.name}
                        </h1>
                        <p className="mt-4 max-w-[48ch] text-base text-pretty text-slate-500">
                            {product.description}
                        </p>
                    </div>

                    <div className="border-t border-slate-950/10 pt-6">
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Price</p>
                                <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                                    ${(product.price_cents / 100).toFixed(2)}
                                </p>
                            </div>
                            <div className="text-right text-sm text-slate-500">
                                <span className="inline-flex items-center gap-1.5">
                                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                    {product.average_rating.toFixed(1)} avg
                                </span>
                                <p className="mt-0.5">
                                    {product.review_count} reviews
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                className="rounded-md bg-slate-950 py-2.5 pr-4 pl-4 text-sm font-medium text-white hover:bg-slate-800"
                            >
                                Add to cart
                            </button>
                            <button
                                type="button"
                                className="rounded-md border border-slate-950/10 py-2.5 pr-4 pl-4 text-sm font-medium text-slate-700 hover:bg-gray-50"
                            >
                                Save for later
                            </button>
                        </div>
                    </div>

                    {product.fit_note ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-5 py-4">
                            <p className="text-xs font-medium text-amber-700">
                                Sizing note
                            </p>
                            <p className="mt-2 text-sm text-pretty text-amber-900">
                                {product.fit_note}
                            </p>
                        </div>
                    ) : null}

                    {product.faq_items.length > 0 ? (
                        <div className="border-t border-slate-950/10 pt-6">
                            <h2 className="text-sm font-medium text-slate-500">
                                FAQ
                            </h2>
                            <div className="mt-4 space-y-3">
                                {product.faq_items.map((faq) => (
                                    <div
                                        key={faq.question}
                                        className="rounded-md border border-slate-950/10 px-5 py-4"
                                    >
                                        <h3 className="font-medium text-slate-950">
                                            {faq.question}
                                        </h3>
                                        <p className="mt-2 text-sm text-pretty text-slate-500">
                                            {faq.answer}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </section>

            {/* Reviews */}
            {reviews.length > 0 ? (
                <section className="border-t border-slate-950/10 py-16">
                    <h2 className="max-w-[35ch] font-['Fraunces',serif] text-2xl font-semibold tracking-tight text-balance text-slate-950">
                        Customer reviews
                    </h2>
                    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {reviews.map((review) => (
                            <article
                                key={review.id}
                                className="rounded-md border border-slate-950/10 p-5"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium text-slate-950">
                                            {review.author_name}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {review.reviewed_at}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-slate-700">
                                        <Star className="size-3 fill-amber-400 text-amber-400" />
                                        {review.rating}/5
                                    </span>
                                </div>
                                {review.title ? (
                                    <h3 className="mt-3 font-semibold text-slate-950">
                                        {review.title}
                                    </h3>
                                ) : null}
                                <p className="mt-2 text-sm text-pretty text-slate-500">
                                    {review.body}
                                </p>
                                {review.approved_response ? (
                                    <div className="mt-4 rounded-md border border-slate-950/10 bg-slate-50 px-4 py-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                                {storeBrand.name} reply
                                            </p>
                                            {review.response_approved_at ? (
                                                <p className="text-xs text-slate-400">
                                                    {review.response_approved_at}
                                                </p>
                                            ) : null}
                                        </div>
                                        <p className="mt-2 text-sm text-pretty text-slate-700">
                                            {review.approved_response}
                                        </p>
                                    </div>
                                ) : null}
                            </article>
                        ))}
                    </div>
                </section>
            ) : null}
        </StorefrontShell>
    );
}
