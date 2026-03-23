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
        $queueReviewAnalysisRun->handle($request->user());

        return back();
    }
}
