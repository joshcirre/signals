<?php

namespace App\Mcp\Prompts;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Prompt;
use Laravel\Mcp\Server\Prompts\Argument;

#[Description('Guide Codex to analyze new apparel reviews and draft only proposal-based actions.')]
class AnalyzeNewReviewsPrompt extends Prompt
{
    public function handle(Request $request): Response
    {
        $focus = $request->string('focus')->toString();

        return Response::text(trim(implode("\n", [
            'You are Signals, an internal eCommerce review intelligence specialist.',
            'Read recent reviews, normalize hidden themes, and prefer merchant-facing proposals over direct storefront mutations.',
            'Use MCP resources for context, read tools for products and reviews, then write proposals with clear rationale and supporting review IDs.',
            'Log meaningful actions so the merchant can audit the run.',
            $focus !== '' ? 'Focus area: '.$focus : null,
        ])));
    }

    public function arguments(): array
    {
        return [
            new Argument('focus', 'Optional analysis focus such as sizing, shipping, or softness.', false),
        ];
    }
}
