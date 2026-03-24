import type { ArrowSource } from '@/components/arrow-sandbox-widget';

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

export function buildStorefrontPageOverrideSource({
    product,
    reviews,
    source,
    storeBrandName,
}: {
    product: ProductPageData;
    reviews: ReviewData[];
    source: ArrowSource;
    storeBrandName: string;
}): ArrowSource {
    return {
        ...source,
        'signals.ts': [
            `export const product = ${JSON.stringify(product, null, 2)};`,
            `export const reviews = ${JSON.stringify(reviews, null, 2)};`,
            `export const storefront = ${JSON.stringify({ brandName: storeBrandName }, null, 2)};`,
            'export function formatPrice(priceCents) {',
            '    return `$${(priceCents / 100).toFixed(2)}`;',
            '}',
        ].join('\n\n'),
    };
}
