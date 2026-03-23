<?php

namespace App\Http\Controllers\Admin;

use App\Events\ReviewAnalysisEventBroadcast;
use App\Events\ReviewAnalysisRunUpdated;
use App\Http\Controllers\Controller;
use App\Models\ActionLog;
use App\Models\ReviewAnalysisRun;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReviewAnalysisRunController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $run = ReviewAnalysisRun::query()->create([
            'user_id' => $request->user()->id,
            'status' => 'queued',
            'prompt' => 'Analyze the latest apparel reviews, confirm any repeated fit problems, and prepare only merchant-facing proposals with a strong preference for a single fit-note update when the evidence is clear.',
            'requested_at' => now(),
        ]);

        $event = ActionLog::query()->create([
            'review_analysis_run_id' => $run->id,
            'actor_type' => 'system',
            'action' => 'run.queued',
            'metadata_json' => [
                'message' => 'Queued ReviewOps run and waiting for a connected local helper to claim it.',
            ],
        ]);

        ReviewAnalysisRunUpdated::dispatch($run);
        ReviewAnalysisEventBroadcast::dispatch($request->user(), $event);

        return back();
    }
}
