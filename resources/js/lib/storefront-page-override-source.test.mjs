import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStorefrontPageOverrideSource } from './storefront-page-override-source.ts';

test('buildStorefrontPageOverrideSource injects runtime storefront context', () => {
    const source = buildStorefrontPageOverrideSource({
        product: {
            id: 1,
            name: 'Premium Hoodie',
            slug: 'premium-hoodie',
            category: 'Outerwear',
            price_cents: 11800,
            hero_image_url: 'https://example.com/hoodie.jpg',
            short_description: 'Soft brushed fleece.',
            description: 'A modern hoodie.',
            fit_note: 'Runs small.',
            faq_items: [],
            average_rating: 3.2,
            review_count: 5,
        },
        reviews: [
            {
                id: 41,
                author_name: 'Mia',
                rating: 3,
                title: 'Runs small',
                body: 'Size up.',
                reviewed_at: '2026-03-23',
                approved_response: null,
                response_approved_at: null,
            },
        ],
        source: {
            'main.ts':
                "import { product } from './signals.ts'; export default html`<section>${product.name}</section>`",
        },
        storeBrandName: 'Signals Supply',
    });

    assert.equal(
        source['main.ts'],
        "import { product } from './signals.ts'; export default html`<section>${product.name}</section>`",
    );
    assert.match(source['signals.ts'] ?? '', /Premium Hoodie/);
    assert.match(source['signals.ts'] ?? '', /Signals Supply/);
    assert.match(source['signals.ts'] ?? '', /formatPrice/);
});
