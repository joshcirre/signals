<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Signals\QueueReviewAnalysisRunAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreReviewAnalysisRunRequest;
use App\Models\Proposal;
use Illuminate\Http\RedirectResponse;

class ReviewAnalysisRunController extends Controller
{
    public function __invoke(StoreReviewAnalysisRunRequest $request, QueueReviewAnalysisRunAction $queueReviewAnalysisRun): RedirectResponse
    {
        $kind = $request->string('kind')->toString() ?: 'review_analysis';
        $focus = mb_trim($request->string('focus')->toString());
        $proposal = null;

        if ($kind === 'storefront_adaptation') {
            $proposal = Proposal::query()
                ->whereKey((int) $request->integer('proposal_id'))
                ->whereHas('run', fn ($query) => $query->where('user_id', $request->user()->id))
                ->firstOrFail();
        }

        if ($kind === 'ui_refinement') {
            $proposal = Proposal::query()
                ->whereKey((int) $request->integer('proposal_id'))
                ->where('type', 'storefront_widget')
                ->firstOrFail();
        }

        $run = $queueReviewAnalysisRun->handle(
            $request->user(),
            $kind,
            $proposal,
            null,
            $focus !== '' ? $focus : null,
        );

        if ($request->string('redirect_to')->toString() === 'signals') {
            $parameters = $focus !== '' ? ['q' => $focus] : [];

            return to_route('admin.signals', $parameters);
        }

        if ($request->string('redirect_to')->toString() === 'proposals') {
            return to_route('admin.proposals.index');
        }

        return to_route('admin.review-runs.show', $run);
    }
}
