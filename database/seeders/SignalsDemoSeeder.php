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
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SignalsDemoSeeder extends Seeder
{
    use WithoutModelEvents;

    private const string DEMO_EMAIL = 'admin@example.com';

    private const string DEMO_PASSWORD = 'password';

    public function run(): void
    {
        DB::transaction(function (): void {
            $admin = User::query()->updateOrCreate(
                ['email' => self::DEMO_EMAIL],
                [
                    'name' => 'Signals Admin',
                    'password' => Hash::make(self::DEMO_PASSWORD),
                    'role' => 'merchant_admin',
                    'email_verified_at' => now(),
                ],
            );

            $products = $this->seedProducts();
            $this->resetDemoProductData($products);

            $tags = $this->seedTags();
            $reviews = $this->seedReviews($products, $tags);
            $this->seedClusters($products);
            $this->seedRunAndProposals($admin, $products, $reviews);
        });
    }

    /**
     * @return Collection<string, Product>
     */
    private function seedProducts(): Collection
    {
        return collect([
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
                'hero_image_url' => 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'name' => 'Trail Blend Crewneck',
                'slug' => 'trail-blend-crewneck',
                'price_cents' => 6900,
                'short_description' => 'A midweight crewneck that lands between polished and lived-in.',
                'description' => 'The Trail Blend Crewneck uses a recycled cotton blend with a structured collar and a soft interior. It is the easy layer you leave by the door.',
                'hero_image_url' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
            ],
        ])->mapWithKeys(fn (array $product): array => [
            $product['slug'] => Product::query()->updateOrCreate(
                ['slug' => $product['slug']],
                [
                    ...$product,
                    'category' => 'Apparel',
                    'fit_note' => null,
                    'faq_items' => null,
                    'status' => 'active',
                ],
            ),
        ]);
    }

    /**
     * @param  Collection<string, Product>  $products
     */
    private function resetDemoProductData(Collection $products): void
    {
        $productIds = $products->pluck('id');

        Proposal::query()
            ->where('target_type', 'product')
            ->whereIn('target_id', $productIds)
            ->delete();

        $reviewIds = Review::query()
            ->whereIn('product_id', $productIds)
            ->pluck('id');

        Proposal::query()
            ->where('target_type', 'review')
            ->whereIn('target_id', $reviewIds)
            ->delete();

        ReviewTagAssignment::query()
            ->whereIn('review_id', $reviewIds)
            ->delete();

        ReviewCluster::query()
            ->whereIn('product_id', $productIds)
            ->delete();

        Review::query()
            ->whereIn('product_id', $productIds)
            ->delete();
    }

    /**
     * @return Collection<string, ReviewTag>
     */
    private function seedTags(): Collection
    {
        return collect([
            'Sizing Issue',
            'Softness Praise',
            'Shipping Delay',
            'Packaging Problem',
            'Quality Praise',
        ])->mapWithKeys(fn (string $name): array => [
            $name => ReviewTag::query()->updateOrCreate(
                ['normalized_name' => $name],
                [
                    'name' => $name,
                    'visibility' => 'internal',
                ],
            ),
        ]);
    }

    /**
     * @param  Collection<string, Product>  $products
     * @param  Collection<string, ReviewTag>  $tags
     * @return Collection<int, Review>
     */
    private function seedReviews(Collection $products, Collection $tags): Collection
    {
        $reviews = collect();

        $reviewData = [
            'premium-hoodie' => [
                ['Mia', 2, 'Runs much smaller than expected', 'I normally wear a medium and this felt tight through the shoulders. I would size up if you want a relaxed fit.', 'Sizing Issue', 2, null],
                ['Jordan', 3, 'Soft but the fit was off', 'The fleece is excellent, but the hoodie runs tiny compared to the size chart. Large fit closer to a medium.', 'Sizing Issue', 4, null],
                ['Taylor', 2, 'Too snug in the chest', 'Really wanted to love it, but the cut is slimmer than it looks in the photos. Going up one size would have helped.', 'Sizing Issue', 6, 110],
                ['Noah', 4, 'Warm and premium', 'Material feels expensive and the hood sits well. I just wish there was a fit note before I ordered.', 'Sizing Issue', 8, 70],
                ['Avery', 5, 'Great fabric weight', 'Very soft interior and solid construction. Ordering a size up gave me the roomy fit I wanted.', 'Quality Praise', 11, 40],
            ],
            'cloudweight-tee' => [
                ['Elliot', 5, 'Ridiculously soft tee', 'This shirt feels broken in right away. Easily my favorite everyday tee right now.', 'Softness Praise', 3, 150],
                ['Riley', 5, 'Comfort is the main win', 'Super soft, lightweight, and breathable. I bought two more after the first wash.', 'Softness Praise', 5, 125],
                ['Hayden', 4, 'Perfect casual shirt', 'Great softness and drape. Could be a little longer, but overall very comfortable.', 'Softness Praise', 7, 95],
                ['Casey', 2, 'Shipping was slow', 'The shirt is nice once it arrived, but delivery took longer than expected with no updates.', 'Shipping Delay', 9, 60],
                ['Parker', 4, 'Comfortable from day one', 'Fabric feels excellent and it layers well. Wish shipping had been a bit faster.', 'Shipping Delay', 13, 25],
            ],
            'studio-joggers' => [
                ['Blake', 5, 'Exactly what I wanted', 'Clean enough for travel but still comfortable. The stretch is noticeable in a good way.', 'Quality Praise', 2, 145],
                ['Morgan', 4, 'Great fit and movement', 'Waistband stays put and the taper looks sharp. Slightly longer inseam than expected.', 'Quality Praise', 6, 105],
                ['Quinn', 2, 'Package showed up damaged', 'Joggers were fine, but the outer bag was torn when it arrived. Not ideal for a premium item.', 'Packaging Problem', 10, 80],
                ['Dakota', 3, 'Comfortable, packaging issue', 'Product is good, but the packaging looked rough and wrinkled right out of the mailer.', 'Packaging Problem', 14, 55],
                ['Rowan', 5, 'Worth the price', 'Material holds shape well and looks more elevated than typical joggers.', 'Quality Praise', 18, 20],
            ],
            'trail-blend-crewneck' => [
                ['Finley', 5, 'Great quality layer', 'Dense fabric, clean neckline, and no weird shrinkage after wash. Really impressed.', 'Quality Praise', 1, 135],
                ['Sawyer', 4, 'Solid everyday crew', 'Comfortable and easy to style. Sleeves are a touch long, but quality is there.', 'Quality Praise', 4, 90],
                ['Emerson', 3, 'Shipping lagged', 'Crewneck is good, but it sat in transit for days with no movement.', 'Shipping Delay', 8, 65],
                ['Reese', 4, 'Nice texture and finish', 'Feels premium without being stiff. I would order again.', 'Quality Praise', 12, 30],
                ['Kai', 5, 'Better than expected', 'Looks polished enough for going out and still feels soft inside.', 'Softness Praise', 16, 10],
            ],
        ];

        foreach ($reviewData as $slug => $entries) {
            /** @var Product $product */
            $product = $products->get($slug);

            foreach ($entries as [$author, $rating, $title, $body, $tagName, $reviewedDaysAgo, $processedMinutesAgo]) {
                $review = Review::query()->create([
                    'product_id' => $product->id,
                    'author_name' => $author,
                    'rating' => $rating,
                    'title' => $title,
                    'body' => $body,
                    'source' => 'storefront',
                    'reviewed_at' => now()->subDays($reviewedDaysAgo),
                    'processed_at' => $processedMinutesAgo === null ? null : now()->subMinutes($processedMinutesAgo),
                    'response_draft' => null,
                    'response_draft_status' => null,
                    'response_draft_approved_at' => null,
                ]);

                ReviewTagAssignment::query()->create([
                    'review_id' => $review->id,
                    'review_tag_id' => $tags->get($tagName)->id,
                    'confidence' => $tagName === 'Sizing Issue' ? 0.960 : 0.890,
                    'assigned_by' => 'agent',
                ]);

                $reviews->push($review);
            }
        }

        return $reviews;
    }

    /**
     * @param  Collection<string, Product>  $products
     */
    private function seedClusters(Collection $products): void
    {
        ReviewCluster::query()->create([
            'product_id' => $products->get('premium-hoodie')->id,
            'title' => 'Repeated fit issue on the Premium Hoodie',
            'summary' => 'Multiple recent reviews say the Premium Hoodie runs small through the chest and shoulders.',
            'severity' => 'high',
            'review_count' => 4,
        ]);
    }

    /**
     * @param  Collection<string, Product>  $products
     * @param  Collection<int, Review>  $reviews
     */
    private function seedRunAndProposals(User $admin, Collection $products, Collection $reviews): void
    {
        $existingRuns = ReviewAnalysisRun::query()
            ->where('user_id', $admin->id)
            ->pluck('id');

        ActionLog::query()
            ->whereIn('review_analysis_run_id', $existingRuns)
            ->delete();

        Proposal::query()
            ->whereIn('review_analysis_run_id', $existingRuns)
            ->delete();

        ReviewAnalysisRun::query()
            ->whereIn('id', $existingRuns)
            ->delete();

        $run = ReviewAnalysisRun::query()->create([
            'user_id' => $admin->id,
            'status' => 'completed',
            'prompt' => 'Analyze the latest apparel reviews and create merchant-facing proposals.',
            'summary' => 'Codex found a strong sizing signal on the Premium Hoodie and drafted one storefront copy update.',
            'requested_at' => now()->subMinutes(20),
            'started_at' => now()->subMinutes(19),
            'completed_at' => now()->subMinutes(17),
        ]);

        $hoodie = $products->get('premium-hoodie');
        $supportingReviews = $reviews
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

        $shippingReview = $reviews->first(
            fn (Review $review): bool => $review->rating <= 2
                && $review->product_id === $products->get('cloudweight-tee')->id,
        );

        if ($shippingReview instanceof Review) {
            Proposal::query()->create([
                'review_analysis_run_id' => $run->id,
                'type' => 'review_response',
                'status' => 'pending',
                'target_type' => 'review',
                'target_id' => $shippingReview->id,
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
            ['system', 'run.queued', 'Queued a new Signals analysis run.'],
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
