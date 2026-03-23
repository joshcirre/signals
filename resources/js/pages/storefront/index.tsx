import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    MessageSquareQuote,
    ShieldCheck,
    Sparkles,
    Star,
} from 'lucide-react';
import { StorefrontShell } from '@/components/storefront-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { storeBrand } from '@/lib/brand';
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
    const featuredProduct = products[0] ?? null;

    return (
        <StorefrontShell title={storeBrand.name}>
            <section className="grid gap-10 pt-12 pb-12 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
                <div className="space-y-8">
                    <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.7rem] tracking-[0.24em] text-emerald-900 uppercase hover:bg-emerald-50">
                        <Sparkles className="size-3.5" />
                        Signals-powered storefront
                    </Badge>
                    <div className="space-y-5">
                        <p className="text-sm font-medium tracking-[0.28em] text-slate-500 uppercase">
                            {storeBrand.collection}
                        </p>
                        <h1 className="max-w-5xl text-5xl leading-[0.95] tracking-tight text-slate-950 [font-family:'Fraunces',serif] sm:text-6xl lg:text-8xl">
                            Modern apparel pages tuned by what shoppers actually
                            say.
                        </h1>
                        <p className="max-w-2xl text-lg leading-8 text-slate-600">
                            {storeBrand.name} is the public side of Signals. The
                            fit notes, FAQ updates, and storefront language here
                            reflect repeated customer patterns after a merchant
                            approves a proposal in the admin console.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button
                            asChild
                            size="lg"
                            className="rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800"
                        >
                            <Link href={featuredProduct ? `/products/${featuredProduct.slug}` : '/'}>
                                Shop the featured edit
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="rounded-full border-slate-300 bg-white/80 px-6"
                        >
                            <Link href={login()}>Open admin demo</Link>
                        </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-[1.8rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
                            <p className="text-sm text-slate-500">Signal model</p>
                            <p className="mt-3 text-xl font-semibold text-slate-950">
                                Human approval required
                            </p>
                        </div>
                        <div className="rounded-[1.8rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
                            <p className="text-sm text-slate-500">Review base</p>
                            <p className="mt-3 text-xl font-semibold text-slate-950">
                                Realistic seeded shopper feedback
                            </p>
                        </div>
                        <div className="rounded-[1.8rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
                            <p className="text-sm text-slate-500">Live payoff</p>
                            <p className="mt-3 text-xl font-semibold text-slate-950">
                                Fit guidance updates the product page
                            </p>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-[2.2rem] border border-white/80 bg-[linear-gradient(145deg,_rgba(15,23,42,0.96)_0%,_rgba(24,24,27,0.92)_42%,_rgba(15,118,110,0.86)_100%)] p-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium tracking-[0.26em] text-white/60 uppercase">
                            Listening panel
                        </p>
                        <Badge className="rounded-full border-white/12 bg-white/10 px-3 py-1 text-[0.68rem] tracking-[0.2em] text-white uppercase hover:bg-white/10">
                            <MessageSquareQuote className="size-3.5" />
                            Review phrases
                        </Badge>
                    </div>
                    <div className="mt-8 space-y-6">
                        <div className="rounded-[1.8rem] border border-white/10 bg-white/8 p-5">
                            <p className="text-xs tracking-[0.24em] text-white/50 uppercase">
                                Merchant search
                            </p>
                            <p className="mt-3 text-2xl leading-tight [font-family:'Fraunces',serif]">
                                “hoodie reviews about sizing”
                            </p>
                        </div>
                        <div className="grid gap-3">
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm text-white/78">
                                “Loved the fabric, but had to size up.”
                            </div>
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm text-white/78">
                                “Perfect weight for travel, just slimmer than I expected.”
                            </div>
                            <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
                                Signals turns repetition into a fit note only after
                                an operator approves it.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {featuredProduct ? (
                <section className="grid gap-6 pb-8 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="overflow-hidden rounded-[2.4rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                        <img
                            src={featuredProduct.hero_image_url}
                            alt={featuredProduct.name}
                            className="aspect-[5/4] size-full object-cover"
                        />
                    </div>
                    <div className="rounded-[2.4rem] border border-slate-200/80 bg-white/88 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
                        <p className="text-sm font-medium tracking-[0.26em] text-slate-500 uppercase">
                            Featured product
                        </p>
                        <h2 className="mt-4 text-4xl tracking-tight text-slate-950 [font-family:'Fraunces',serif]">
                            {featuredProduct.name}
                        </h2>
                        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                            {featuredProduct.short_description}
                        </p>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-[1.6rem] bg-slate-50 p-5">
                                <p className="text-sm text-slate-500">
                                    Customer rating
                                </p>
                                <p className="mt-3 inline-flex items-center gap-2 text-2xl font-semibold text-slate-950">
                                    <Star className="size-5 fill-amber-400 text-amber-400" />
                                    {featuredProduct.average_rating.toFixed(1)}
                                </p>
                            </div>
                            <div className="rounded-[1.6rem] bg-slate-50 p-5">
                                <p className="text-sm text-slate-500">Price</p>
                                <p className="mt-3 text-2xl font-semibold text-slate-950">
                                    ${(featuredProduct.price_cents / 100).toFixed(2)}
                                </p>
                            </div>
                        </div>
                        {featuredProduct.fit_note ? (
                            <div className="mt-6 rounded-[1.8rem] border border-amber-200 bg-amber-50 p-5 text-amber-950">
                                <div className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.22em] uppercase">
                                    <ShieldCheck className="size-4" />
                                    Shopper guidance
                                </div>
                                <p className="mt-3 leading-7">
                                    {featuredProduct.fit_note}
                                </p>
                            </div>
                        ) : null}
                        <Button
                            asChild
                            size="lg"
                            className="mt-7 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800"
                        >
                            <Link href={`/products/${featuredProduct.slug}`}>
                                Open product page
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    </div>
                </section>
            ) : null}

            <section className="pb-8">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium tracking-[0.24em] text-slate-500 uppercase">
                            Shop the edit
                        </p>
                        <h2 className="mt-3 text-4xl tracking-tight text-slate-950 [font-family:'Fraunces',serif]">
                            A simplified retail surface with a visible AI payoff.
                        </h2>
                    </div>
                    <p className="max-w-md text-sm leading-6 text-slate-500">
                        The storefront stays calm and shopper-focused. Signals runs
                        in the background, then quietly improves the pages people
                        actually buy from.
                    </p>
                </div>

                <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {products.map((product, index) => (
                        <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            className={`group overflow-hidden rounded-[2.2rem] border border-slate-200/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(15,23,42,0.12)] ${
                                index === 0 ? 'xl:col-span-2' : ''
                            }`}
                        >
                            <div
                                className={`grid h-full ${
                                    index === 0
                                        ? 'xl:grid-cols-[1.05fr_0.95fr]'
                                        : ''
                                }`}
                            >
                                <div className="overflow-hidden bg-slate-100">
                                    <img
                                        src={product.hero_image_url}
                                        alt={product.name}
                                        className={`size-full object-cover transition duration-500 group-hover:scale-105 ${
                                            index === 0
                                                ? 'aspect-[4/3]'
                                                : 'aspect-[4/5]'
                                        }`}
                                    />
                                </div>
                                <div className="flex h-full flex-col justify-between p-6">
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs tracking-[0.24em] text-slate-500 uppercase">
                                                    {product.category}
                                                </p>
                                                <h3 className="mt-3 text-3xl tracking-tight text-slate-950 [font-family:'Fraunces',serif]">
                                                    {product.name}
                                                </h3>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-950">
                                                ${(product.price_cents / 100).toFixed(2)}
                                            </span>
                                        </div>
                                        <p className="mt-4 text-sm leading-7 text-slate-600">
                                            {product.short_description}
                                        </p>
                                        {product.fit_note ? (
                                            <div className="mt-5 rounded-[1.5rem] bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
                                                {product.fit_note}
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="mt-6 flex items-center justify-between text-sm">
                                        <span className="text-slate-500">
                                            {product.average_rating.toFixed(1)} stars
                                            · {product.review_count} reviews
                                        </span>
                                        <span className="inline-flex items-center gap-1 font-medium text-slate-950">
                                            View details
                                            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
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
