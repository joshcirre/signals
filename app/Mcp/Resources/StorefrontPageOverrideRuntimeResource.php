<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Uri;
use Laravel\Mcp\Server\Resource;

#[Uri('signals://storefront-page-override-runtime')]
#[Description('The Signals runtime contract for product-scoped Arrow.js page overrides, including the signals.ts exports and a minimal valid example.')]
class StorefrontPageOverrideRuntimeResource extends Resource
{
    public function handle(Request $request): Response
    {
        return Response::json([
            'module' => './signals.ts',
            'source_files' => [
                'Exactly one of main.ts or main.js is required.',
                'main.css is optional.',
                'Do not include signals.ts in the stored payload. Signals injects it at runtime.',
            ],
            'exports' => [
                'product' => [
                    'id' => 'number',
                    'name' => 'string',
                    'slug' => 'string',
                    'category' => 'string',
                    'price_cents' => 'number',
                    'hero_image_url' => 'string',
                    'short_description' => 'string',
                    'description' => 'string',
                    'fit_note' => 'string | null',
                    'faq_items' => 'Array<{ question: string; answer: string }>',
                    'average_rating' => 'number',
                    'review_count' => 'number',
                ],
                'reviews' => 'Array<{ id, author_name, rating, title, body, reviewed_at, approved_response, response_approved_at }>',
                'storefront' => '{ brandName: string }',
                'formatPrice' => '(priceCents: number) => string',
            ],
            'guidance' => [
                'Create a full product page replacement, not a widget.',
                'Keep claims grounded in product fields and live review evidence.',
                'Import Arrow primitives from @arrow-js/core.',
                'Import product, reviews, storefront, and formatPrice from ./signals.ts.',
                'Use html`...` for DOM and reactive(...) only when you need live state.',
                'Wrap live template reads in functions like ${() => state.count}.',
                'Export a default Arrow template or component result from the entry file.',
                'Do not use JSX, React hooks, Vue directives, or direct DOM mutation.',
            ],
            'agent_prompt' => 'Build this UI as an Arrow sandbox payload. Return an object for sandbox({ source }) with exactly one entry file named main.ts or main.js, plus main.css only if styles are needed. Use @arrow-js/core primitives directly: reactive(...) for state, html`...` for DOM, and component(...) only when reusable local state or composition is actually needed. Arrow expression slots are static by default, so any live value must be wrapped in a callable function like ${() => state.count}. Use event bindings like @click="${() => state.count++}", do not use JSX, React hooks, Vue directives, direct DOM mutation, or framework-specific render APIs. Export a default Arrow template or component result from the entry file. Keep the example self-contained, prefer a single clear root view, and communicate back to the host with output(payload) when needed.',
            'example' => [
                'main.ts' => <<<'TS'
import { html } from '@arrow-js/core';
import { product, reviews, formatPrice } from './signals.ts';

const fitReviews = reviews.slice(0, 3);

export default html`
    <section class="page">
        <header class="hero">
            <p class="eyebrow">${product.category}</p>
            <h1>${product.name}</h1>
            <p class="price">${formatPrice(product.price_cents)}</p>
            <p class="fit-note">${product.fit_note ?? 'Fit guidance goes here.'}</p>
        </header>
        <section class="reviews">
            ${fitReviews.map((review) => html`
                <article class="review-card">
                    <strong>${review.author_name}</strong>
                    <p>${review.body}</p>
                </article>
            `)}
        </section>
    </section>
`;
TS,
                'main.css' => <<<'CSS'
.page { display: grid; gap: 24px; font-family: ui-sans-serif, system-ui, sans-serif; }
.hero { padding: 32px; background: #fff7ed; border: 1px solid #fdba74; border-radius: 24px; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px; color: #9a3412; }
.price { font-size: 20px; font-weight: 600; }
.fit-note { margin-top: 12px; font-size: 18px; color: #7c2d12; }
.reviews { display: grid; gap: 12px; }
.review-card { padding: 16px; border: 1px solid #fed7aa; border-radius: 18px; background: white; }
CSS,
            ],
        ]);
    }
}
