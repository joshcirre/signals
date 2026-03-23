<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Signals\QueueReviewAnalysisRunAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReviewAnalysisRunController extends Controller
{
    public function __invoke(Request $request, QueueReviewAnalysisRunAction $queueReviewAnalysisRun): RedirectResponse
    {
        $run = $queueReviewAnalysisRun->handle($request->user());

        return to_route('admin.review-runs.show', $run);
    }
}
