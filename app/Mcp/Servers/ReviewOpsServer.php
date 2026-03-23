<?php

namespace App\Mcp\Servers;

use App\Mcp\Prompts\AnalyzeNewReviewsPrompt;
use App\Mcp\Resources\PendingProposalsResource;
use App\Mcp\Resources\ReviewOpsOverviewResource;
use App\Mcp\Tools\CreateProductCopyChangeProposalTool;
use App\Mcp\Tools\CreateReviewResponseProposalTool;
use App\Mcp\Tools\ListProductsTool;
use App\Mcp\Tools\ListReviewsTool;
use App\Mcp\Tools\LogActionTool;
use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;

#[Name('ReviewOps Server')]
#[Version('0.1.0')]
#[Instructions('Use this server to inspect apparel review intelligence data and write merchant-facing proposals that require approval before storefront changes go live.')]
class ReviewOpsServer extends Server
{
    protected array $tools = [
        ListProductsTool::class,
        ListReviewsTool::class,
        CreateProductCopyChangeProposalTool::class,
        CreateReviewResponseProposalTool::class,
        LogActionTool::class,
    ];

    protected array $resources = [
        ReviewOpsOverviewResource::class,
        PendingProposalsResource::class,
    ];

    protected array $prompts = [
        AnalyzeNewReviewsPrompt::class,
    ];
}
