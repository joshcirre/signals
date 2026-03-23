import { Link } from '@inertiajs/react';
import { ArrowRight, Star } from 'lucide-react';
import { StorefrontShell } from '@/components/storefront-shell';
import { storeBrand } from '@/lib/brand';

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
    const featuredProduct = products[0] ?? null;

    return (
        <StorefrontShell title={storeBrand.name}>
            {/* Hero */}
            <section className="border-b border-slate-950/10 py-16 lg:py-24">
                <p className="text-xs font-medium text-slate-500">
                    {storeBrand.collection}
                </p>
                <h1 className="mt-4 max-w-[30ch] font-['Fraunces',serif] text-5xl tracking-tight text-balance text-slate-950 sm:max-w-[24ch] sm:text-6xl lg:max-w-[20ch] lg:text-7xl">
                    Performance gear built for the mountain.
                </h1>
                <p className="mt-6 max-w-[48ch] text-lg text-pretty text-slate-500">
                    {storeBrand.shopperTagline}
                </p>
                <div className="mt-8">
                    <Link
                        href={
                            featuredProduct
                                ? `/products/${featuredProduct.slug}`
                                : '#'
                        }
                        className="inline-flex items-center gap-2 rounded-sm bg-slate-950 py-2.5 pr-3 pl-3.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        Shop the collection
                        <ArrowRight className="size-4" />
                    </Link>
                </div>
            </section>

            {/* Featured product */}
            {featuredProduct ? (
                <section className="grid border-b border-slate-950/10 lg:grid-cols-2">
                    <div className="overflow-hidden border-b border-slate-950/10 bg-gray-50 lg:border-r lg:border-b-0">
                        <img
                            src={featuredProduct.hero_image_url}
                            alt={featuredProduct.name}
                            className="aspect-[4/3] size-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col justify-center p-10 lg:p-14">
                        <p className="text-xs font-medium text-slate-500">
                            Featured &middot; {featuredProduct.category}
                        </p>
                        <h2 className="mt-4 max-w-[35ch] font-['Fraunces',serif] text-4xl tracking-tight text-balance text-slate-950">
                            {featuredProduct.name}
                        </h2>
                        <p className="mt-4 max-w-[48ch] text-base text-pretty text-slate-500">
                            {featuredProduct.short_description}
                        </p>
                        <div className="mt-5 flex items-center gap-5 text-sm">
                            <span className="inline-flex items-center gap-1.5 text-slate-500">
                                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                {featuredProduct.average_rating.toFixed(1)} avg
                                &middot; {featuredProduct.review_count} reviews
                            </span>
                            <span className="text-base font-semibold text-slate-950">
                                $
                                {(featuredProduct.price_cents / 100).toFixed(2)}
                            </span>
                        </div>
                        {featuredProduct.fit_note ? (
                            <div className="mt-5 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-pretty text-amber-900">
                                <span className="font-medium">
                                    Sizing note:{' '}
                                </span>
                                {featuredProduct.fit_note}
                            </div>
                        ) : null}
                        <Link
                            href={`/products/${featuredProduct.slug}`}
                            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-slate-950 hover:text-slate-600"
                        >
                            View product
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </section>
            ) : null}

            {/* Product grid */}
            <section className="py-16">
                <div className="border-b border-slate-950/10 pb-6">
                    <h2 className="max-w-[35ch] font-['Fraunces',serif] text-2xl font-semibold tracking-tight text-balance text-slate-950">
                        The full collection
                    </h2>
                </div>

                <div className="mt-8 grid gap-px border border-slate-950/5 bg-slate-950/5 md:grid-cols-2 xl:grid-cols-3">
                    {products.map((product, index) => (
                        <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            className={`group bg-white ${
                                index === 0 ? 'xl:col-span-2' : ''
                            }`}
                        >
                            <div
                                className={`grid h-full ${
                                    index === 0 ? 'xl:grid-cols-2' : ''
                                }`}
                            >
                                <div className="overflow-hidden bg-gray-100">
                                    <img
                                        src={product.hero_image_url}
                                        alt={product.name}
                                        className={`size-full object-cover transition-transform duration-500 group-hover:scale-[1.02] ${
                                            index === 0
                                                ? 'aspect-[4/3]'
                                                : 'aspect-[4/5]'
                                        }`}
                                    />
                                </div>
                                <div className="flex flex-col justify-between p-6">
                                    <div>
                                        <p className="text-xs font-medium text-slate-400">
                                            {product.category}
                                        </p>
                                        <h3 className="mt-2 max-w-[35ch] font-['Fraunces',serif] text-2xl tracking-tight text-balance text-slate-950">
                                            {product.name}
                                        </h3>
                                        <p className="mt-3 max-w-[48ch] text-sm text-pretty text-slate-500">
                                            {product.short_description}
                                        </p>
                                        {product.fit_note ? (
                                            <p className="mt-4 rounded-sm bg-amber-50 px-3 py-2 text-xs text-pretty text-amber-800">
                                                <span className="font-medium">
                                                    Sizing:{' '}
                                                </span>
                                                {product.fit_note}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="mt-6 flex items-center justify-between text-sm">
                                        <span className="text-slate-400">
                                            {product.average_rating.toFixed(1)}{' '}
                                            &middot; {product.review_count}{' '}
                                            reviews
                                        </span>
                                        <span className="font-semibold text-slate-950">
                                            $
                                            {(
                                                product.price_cents / 100
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </StorefrontShell>
    );
}
