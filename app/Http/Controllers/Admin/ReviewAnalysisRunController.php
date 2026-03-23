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
        $proposal = null;

        if ($kind === 'storefront_adaptation') {
            $proposal = Proposal::query()
                ->whereKey((int) $request->integer('proposal_id'))
                ->whereHas('run', fn ($query) => $query->where('user_id', $request->user()->id))
                ->firstOrFail();
        }

        $run = $queueReviewAnalysisRun->handle($request->user(), $kind, $proposal);

        return to_route('admin.review-runs.show', $run);
    }
}
