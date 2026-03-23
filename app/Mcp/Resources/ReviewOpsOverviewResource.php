<?php

namespace App\Mcp\Resources;

use App\Models\Product;
use App\Models\Proposal;
use App\Models\Review;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Uri;
use Laravel\Mcp\Server\Resource;

#[Uri('reviewops://overview')]
#[Description('A high-level operational summary of the ReviewOps workspace.')]
class ReviewOpsOverviewResource extends Resource
{
    public function handle(Request $request): Response
    {
        return Response::text(implode("\n", [
            'ReviewOps workspace overview',
            'Products: '.Product::query()->count(),
            'Reviews: '.Review::query()->count(),
            'Pending proposals: '.Proposal::query()->where('status', 'pending')->count(),
            'Low-rating reviews: '.Review::query()->where('rating', '<=', 3)->count(),
        ]));
    }
}
