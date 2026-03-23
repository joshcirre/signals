<?php

namespace App\Mcp\Tools;

use App\Models\Review;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Str;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Search reviews using raw text, hidden tags, product metadata, and cluster summaries with matched-because explanations.')]
class SearchReviewsTool extends Tool
{
    public function handle(Request $request): Response
    {
        $query = mb_trim($request->string('query')->toString());
        $limit = min((int) ($request->get('limit') ?? 12), 25);
        $terms = $this->expandedSearchTerms($query);

        $reviews = Review::query()
            ->with(['product.reviewClusters', 'tagAssignments.reviewTag'])
            ->latest('reviewed_at')
            ->limit(50)
            ->get()
            ->map(function (Review $review) use ($query, $terms): array {
                $signals = $this->scoreReview($review, $query, $terms);

                return [
                    'id' => $review->id,
                    'product' => [
                        'id' => $review->product?->id,
                        'name' => $review->product?->name,
                        'slug' => $review->product?->slug,
                    ],
                    'rating' => $review->rating,
                    'title' => $review->title,
                    'body' => $review->body,
                    'reviewed_at' => $review->reviewed_at?->toIso8601String(),
                    'tags' => $review->tagAssignments->map(fn ($assignment): array => [
                        'name' => $assignment->reviewTag?->normalized_name,
                        'confidence' => (float) $assignment->confidence,
                    ])->values(),
                    'match_score' => $signals['score'],
                    'matched_because' => $signals['reasons'],
                ];
            })
            ->filter(fn (array $review): bool => $query === '' || $review['match_score'] > 0)
            ->sortByDesc('match_score')
            ->values()
            ->take($limit);

        return Response::json([
            'query' => $query,
            'reviews' => $reviews,
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'query' => $schema->string()->required(),
            'limit' => $schema->integer()->min(1)->max(25),
        ];
    }

    /**
     * @return array{score: int, reasons: array<int, string>}
     */
    private function scoreReview(Review $review, string $query, array $terms): array
    {
        $score = 0;
        $reasons = [];
        $reviewText = Str::lower(implode(' ', array_filter([$review->title, $review->body])));

        if ($reviewText !== '' && Str::contains($reviewText, Str::lower($query))) {
            $score += 6;
            $reasons[] = 'Direct review text match';
        }

        foreach ($terms as $term) {
            if (Str::contains($reviewText, $term)) {
                $score += 2;
                $reasons[] = 'Matched review language like "'.$term.'"';
                break;
            }
        }

        if ($review->product !== null) {
            $productText = Str::lower(implode(' ', array_filter([
                $review->product->name,
                $review->product->category,
                $review->product->short_description,
            ])));

            foreach ($terms as $term) {
                if (Str::contains($productText, $term)) {
                    $score += 3;
                    $reasons[] = 'Product match: '.$review->product->name;
                    break;
                }
            }

            foreach ($review->product->reviewClusters as $cluster) {
                $clusterText = Str::lower($cluster->title.' '.$cluster->summary);

                foreach ($terms as $term) {
                    if (Str::contains($clusterText, $term)) {
                        $score += 3;
                        $reasons[] = 'Cluster match: '.$cluster->title;
                        break 2;
                    }
                }
            }
        }

        foreach ($review->tagAssignments as $assignment) {
            $tag = $assignment->reviewTag?->normalized_name;

            if (! is_string($tag)) {
                continue;
            }

            if ($tag === '') {
                continue;
            }

            foreach ($terms as $term) {
                if (Str::contains(Str::lower($tag), $term)) {
                    $score += 4;
                    $reasons[] = 'Hidden tag match: '.$tag;
                    break 2;
                }
            }
        }

        if ($review->rating <= 2) {
            $score += 1;
            $reasons[] = 'Low rating review';
        }

        if ($reasons === []) {
            $reasons[] = 'Related merchant signal';
        }

        return [
            'score' => $score,
            'reasons' => collect($reasons)->unique()->values()->all(),
        ];
    }

    /**
     * @return array<int, string>
     */
    private function expandedSearchTerms(string $query): array
    {
        $tokens = collect(preg_split('/\s+/', Str::lower($query)) ?: [])
            ->map(fn (string $token): string => preg_replace('/[^a-z0-9]/', '', $token) ?: '')
            ->filter(fn (string $token): bool => $token !== '' && ! in_array($token, [
                'show',
                'me',
                'about',
                'for',
                'the',
                'and',
                'with',
                'reviews',
                'review',
            ], true));

        $aliases = [
            'sizing' => ['size', 'small', 'tiny', 'tight', 'fit'],
            'fit' => ['sizing', 'small', 'tight'],
            'shipping' => ['delay', 'late', 'delayed'],
            'comfort' => ['comfortable', 'soft', 'softness'],
            'quality' => ['quality', 'stitching', 'material'],
            'packaging' => ['box', 'broken', 'chipped', 'arrival'],
            'hoodie' => ['hoodie', 'premium'],
        ];

        foreach ($tokens->all() as $token) {
            if (array_key_exists($token, $aliases)) {
                $tokens = $tokens->merge($aliases[$token]);
            }
        }

        return $tokens->unique()->values()->all();
    }
}
