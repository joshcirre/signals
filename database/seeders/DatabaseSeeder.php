<?php

namespace Database\Seeders;

use App\Models\ActionLog;
use App\Models\Product;
use App\Models\Proposal;
use App\Models\Review;
use App\Models\ReviewAnalysisRun;
use App\Models\ReviewCluster;
use App\Models\ReviewTag;
use App\Models\ReviewTagAssignment;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::factory()->create([
            'name' => 'Review Ops Admin',
            'email' => 'admin@example.com',
            'role' => 'merchant_admin',
        ]);

        $products = collect([
            [
                'name' => 'Premium Hoodie',
                'slug' => 'premium-hoodie',
                'price_cents' => 7800,
                'short_description' => 'A brushed fleece hoodie built for daily wear and cooler nights.',
                'description' => 'The Premium Hoodie combines heavyweight brushed fleece with a clean silhouette. It is warm, soft, and tailored enough to wear outside the house without looking sloppy.',
                'hero_image_url' => 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'name' => 'Cloudweight Tee',
                'slug' => 'cloudweight-tee',
                'price_cents' => 3400,
                'short_description' => 'A lightweight tee with a broken-in feel from the first wear.',
                'description' => 'Our Cloudweight Tee is cut from a breathable cotton blend that feels soft straight out of the box. It is designed for layering, travel, and repeat wear.',
                'hero_image_url' => 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'name' => 'Studio Joggers',
                'slug' => 'studio-joggers',
                'price_cents' => 6200,
                'short_description' => 'Tapered joggers with stretch and structure for travel days and errands.',
                'description' => 'Studio Joggers balance comfort and polish with a tapered leg, secure waistband, and enough stretch to move naturally all day.',
                'hero_image_url' => 'https://images.unsplash.com/photo-1506629905607-d9d06ec8a174?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'name' => 'Trail Blend Crewneck',
                'slug' => 'trail-blend-crewneck',
                'price_cents' => 6900,
                'short_description' => 'A midweight crewneck that lands between polished and lived-in.',
                'description' => 'The Trail Blend Crewneck uses a recycled cotton blend with a structured collar and a soft interior. It is the easy layer you leave by the door.',
                'hero_image_url' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
            ],
        ])->map(fn (array $product) => Product::query()->create([
            ...$product,
            'category' => 'Apparel',
            'fit_note' => null,
            'faq_items' => null,
            'status' => 'active',
        ]));

        $tags = collect([
            'Sizing Issue',
            'Softness Praise',
            'Shipping Delay',
            'Packaging Problem',
            'Quality Praise',
        ])->mapWithKeys(fn (string $name) => [
            $name => ReviewTag::query()->create([
                'name' => $name,
                'normalized_name' => $name,
                'visibility' => 'internal',
            ]),
        ]);

        $productMap = $products->keyBy('slug');
        $createdReviews = collect();

        $reviewsByProduct = [
            'premium-hoodie' => [
                [2, 'Runs much smaller than expected', 'I normally wear a medium and this felt tight through the shoulders. I would size up if you want a relaxed fit.', 'Sizing Issue'],
                [3, 'Soft but the fit was off', 'The fleece is excellent, but the hoodie runs tiny compared to the size chart. Large fit closer to a medium.', 'Sizing Issue'],
                [2, 'Too snug in the chest', 'Really wanted to love it, but the cut is slimmer than it looks in the photos. Going up one size would have helped.', 'Sizing Issue'],
                [4, 'Warm and premium', 'Material feels expensive and the hood sits well. I just wish there was a fit note before I ordered.', 'Sizing Issue'],
                [5, 'Great fabric weight', 'Very soft interior and solid construction. Ordering a size up gave me the roomy fit I wanted.', 'Quality Praise'],
            ],
            'cloudweight-tee' => [
                [5, 'Ridiculously soft tee', 'This shirt feels broken in right away. Easily my favorite everyday tee right now.', 'Softness Praise'],
                [5, 'Comfort is the main win', 'Super soft, lightweight, and breathable. I bought two more after the first wash.', 'Softness Praise'],
                [4, 'Perfect casual shirt', 'Great softness and drape. Could be a little longer, but overall very comfortable.', 'Softness Praise'],
                [2, 'Shipping was slow', 'The shirt is nice once it arrived, but delivery took longer than expected with no updates.', 'Shipping Delay'],
                [4, 'Comfortable from day one', 'Fabric feels excellent and it layers well. Wish shipping had been a bit faster.', 'Shipping Delay'],
            ],
            'studio-joggers' => [
                [5, 'Exactly what I wanted', 'Clean enough for travel but still comfortable. The stretch is noticeable in a good way.', 'Quality Praise'],
                [4, 'Great fit and movement', 'Waistband stays put and the taper looks sharp. Slightly longer inseam than expected.', 'Quality Praise'],
                [2, 'Package showed up damaged', 'Joggers were fine, but the outer bag was torn when it arrived. Not ideal for a premium item.', 'Packaging Problem'],
                [3, 'Comfortable, packaging issue', 'Product is good, but the packaging looked rough and wrinkled right out of the mailer.', 'Packaging Problem'],
                [5, 'Worth the price', 'Material holds shape well and looks more elevated than typical joggers.', 'Quality Praise'],
            ],
            'trail-blend-crewneck' => [
                [5, 'Great quality layer', 'Dense fabric, clean neckline, and no weird shrinkage after wash. Really impressed.', 'Quality Praise'],
                [4, 'Solid everyday crew', 'Comfortable and easy to style. Sleeves are a touch long, but quality is there.', 'Quality Praise'],
                [3, 'Shipping lagged', 'Crewneck is good, but it sat in transit for days with no movement.', 'Shipping Delay'],
                [4, 'Nice texture and finish', 'Feels premium without being stiff. I would order again.', 'Quality Praise'],
                [5, 'Better than expected', 'Looks polished enough for going out and still feels soft inside.', 'Softness Praise'],
            ],
        ];

        foreach ($reviewsByProduct as $slug => $entries) {
            $product = $productMap->get($slug);

            foreach ($entries as $index => [$rating, $title, $body, $tagName]) {
                $review = Review::query()->create([
                    'product_id' => $product->id,
                    'author_name' => fake()->firstName(),
                    'rating' => $rating,
                    'title' => $title,
                    'body' => $body,
                    'source' => 'storefront',
                    'reviewed_at' => now()->subDays(fake()->numberBetween(1, 21)),
                    'processed_at' => $index <= 1 ? null : now()->subMinutes(fake()->numberBetween(5, 240)),
                ]);

                ReviewTagAssignment::query()->create([
                    'review_id' => $review->id,
                    'review_tag_id' => $tags[$tagName]->id,
                    'confidence' => $tagName === 'Sizing Issue' ? 0.960 : 0.890,
                    'assigned_by' => 'agent',
                ]);

                $createdReviews->push($review);
            }
        }

        ReviewCluster::query()->create([
            'product_id' => $productMap['premium-hoodie']->id,
            'title' => 'Sizing complaints on hoodie',
            'summary' => 'Multiple recent reviews say the Premium Hoodie runs small through the chest and shoulders.',
            'severity' => 'high',
            'review_count' => 4,
        ]);

        $run = ReviewAnalysisRun::query()->create([
            'user_id' => $admin->id,
            'status' => 'completed',
            'prompt' => 'Analyze the latest apparel reviews and create merchant-facing proposals.',
            'summary' => 'Codex found a strong sizing signal on the Premium Hoodie and drafted one storefront copy update.',
            'requested_at' => now()->subMinutes(20),
            'started_at' => now()->subMinutes(19),
            'completed_at' => now()->subMinutes(17),
        ]);

        $hoodie = $productMap['premium-hoodie'];
        $supportingReviews = $createdReviews
            ->where('product_id', $hoodie->id)
            ->take(4)
            ->pluck('id')
            ->values()
            ->all();

        Proposal::query()->create([
            'review_analysis_run_id' => $run->id,
            'type' => 'product_copy_change',
            'status' => 'pending',
            'target_type' => 'product',
            'target_id' => $hoodie->id,
            'payload_json' => [
                'field' => 'fit_note',
                'before' => null,
                'after' => 'Customers say this hoodie runs small. Consider sizing up for a roomier fit.',
                'supporting_review_ids' => $supportingReviews,
            ],
            'rationale' => 'Four recent Premium Hoodie reviews mention the fit being tight, small, or slimmer than expected.',
            'confidence' => 0.970,
            'created_by' => 'agent',
        ]);

        $negativeShippingReview = $createdReviews
            ->first(fn (Review $review): bool => $review->rating <= 2 && $review->product_id === $productMap['cloudweight-tee']->id);

        if ($negativeShippingReview instanceof Review) {
            Proposal::query()->create([
                'review_analysis_run_id' => $run->id,
                'type' => 'review_response',
                'status' => 'pending',
                'target_type' => 'review',
                'target_id' => $negativeShippingReview->id,
                'payload_json' => [
                    'response_draft' => 'Thanks for flagging the shipping delay. We are sorry the delivery window missed expectations, and our support team can help make this right.',
                    'tone' => 'empathetic',
                ],
                'rationale' => 'A low-rated Cloudweight Tee review called out delayed shipping and missing updates, so Codex drafted a brand-safe response for approval.',
                'confidence' => 0.920,
                'created_by' => 'agent',
            ]);
        }

        collect([
            ['system', 'run.queued', 'Queued a new ReviewOps analysis run.'],
            ['agent', 'tool.call', 'Read latest products and reviews from MCP.'],
            ['agent', 'proposal.created', 'Drafted a fit note proposal for Premium Hoodie.'],
            ['agent', 'proposal.created', 'Drafted a review response for a delayed-shipping complaint.'],
        ])->each(function (array $entry) use ($run): void {
            ActionLog::query()->create([
                'review_analysis_run_id' => $run->id,
                'actor_type' => $entry[0],
                'action' => $entry[1],
                'metadata_json' => ['message' => $entry[2]],
            ]);
        });
    }
}
