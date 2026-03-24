export function buildReviewAnalysisPrompt(basePrompt) {
    return `${basePrompt}

Use the signals MCP server as the source of truth for products, reviews, resources, and proposal writes.
Do not inspect the local filesystem or use shell commands for business data. Stay inside MCP unless a failure prevents it.

Required workflow:
1. Inspect the signals MCP server and recent reviews before you draft anything.
2. Use MCP tools and resources instead of inventing product or review details.
3. Normalize hidden tags and cluster repeated issues before you draft customer-facing proposals.
4. Record concise milestones with the log_action MCP tool when you confirm a meaningful pattern.
5. Create at most one high-confidence product copy proposal if the evidence is clear, and draft review responses only for genuinely negative reviews.
6. Mark the analyzed reviews as processed before you finish the run.
7. Do not apply or publish changes directly. Customer-facing output must go through proposal tools only.

Aim for a concrete fit-note style proposal when the review evidence supports it.`;
}

export function buildStorefrontAdaptationPrompt(run) {
    return `${run.prompt}

Current live review_analysis_run_id: ${run.id}

Use the signals MCP server as the source of truth for product data, reviews, and proposal writes.
Use find_storefront_page_override_proposal_tool to check for an existing override before creating a new one.
Read signals://storefront-page-override-runtime for the exact signals.ts contract and a minimal valid Arrow example.
When you call create_storefront_page_override_proposal_tool, pass review_analysis_run_id=${run.id}.
Stay inside the live Arrow.js proposal flow for this run.
Return only a valid Arrow sandbox source payload with exactly one entry file named main.ts or main.js, plus optional main.css.
Import Arrow primitives from @arrow-js/core and runtime data from ./signals.ts.
Wrap live template values in callable expressions like \${() => state.count}.
Do not use JSX, React hooks, Vue directives, or direct DOM mutation.
Do not inspect or modify shared Laravel or React storefront files.
Do not use bash, rg, sed, or local file inspection to look for Arrow examples or run metadata unless a Signals MCP tool/resource failure makes the live override path impossible.`.trim();
}

export function buildUiRefinementPrompt(run) {
    return `${run.prompt}

Current live review_analysis_run_id: ${run.id}

Continue on the same Codex thread and refine the existing live Arrow.js proposal in place.
Use find_storefront_page_override_proposal_tool when you need to confirm the current proposal state.
Read signals://storefront-page-override-runtime for the exact signals.ts contract and a minimal valid Arrow example.
When you call the live proposal tool, pass review_analysis_run_id=${run.id}.
Return only a valid Arrow sandbox source payload with exactly one entry file named main.ts or main.js, plus optional main.css.
Import Arrow primitives from @arrow-js/core and runtime data from ./signals.ts.
Wrap live template values in callable expressions like \${() => state.count}.
Do not use JSX, React hooks, Vue directives, or direct DOM mutation.
Do not switch this run into local repository edits.
Do not use bash, rg, sed, or local file inspection for Arrow examples or run metadata unless the Signals MCP path is unavailable.`.trim();
}

export function buildDeveloperInstructions(kind) {
    if (kind === 'storefront_adaptation' || kind === 'ui_refinement') {
        return 'Operate as a live Signals Arrow.js storefront agent. Use the signals MCP server for product truth and proposal writes, keep work inside the live override flow, and avoid local repository edits for adaptation or refinement runs.';
    }

    return 'Operate as a merchant Signals analyst. Prefer MCP tools over freeform speculation, do not inspect the local repo or shell for product data, keep reasoning concise, and only produce customer-visible changes through proposal tools.';
}

export function buildRunPrompt(run) {
    if (run.kind === 'storefront_adaptation') {
        return buildStorefrontAdaptationPrompt(run);
    }

    if (run.kind === 'ui_refinement') {
        return buildUiRefinementPrompt(run);
    }

    return buildReviewAnalysisPrompt(run.prompt);
}
