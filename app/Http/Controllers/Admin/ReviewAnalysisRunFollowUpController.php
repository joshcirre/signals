<?php

namespace App\Http\Controllers\Admin;

use App\Events\ReviewAnalysisEventBroadcast;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreReviewAnalysisRunFollowUpRequest;
use App\Models\ActionLog;
use App\Models\ReviewAnalysisRun;
use App\Models\ReviewAnalysisRunFollowUp;
use Illuminate\Http\RedirectResponse;
use Throwable;

class ReviewAnalysisRunFollowUpController extends Controller
{
    public function __invoke(StoreReviewAnalysisRunFollowUpRequest $request, ReviewAnalysisRun $reviewAnalysisRun): RedirectResponse
    {
        abort_if($reviewAnalysisRun->user_id !== $request->user()?->id, 404);
        abort_if($reviewAnalysisRun->codex_thread_id === null, 422);

        ReviewAnalysisRunFollowUp::query()->create([
            'review_analysis_run_id' => $reviewAnalysisRun->id,
            'requested_by' => $request->user()?->id,
            'content' => $request->string('content')->toString(),
            'status' => 'queued',
            'requested_at' => now(),
        ]);

        $event = ActionLog::query()->create([
            'review_analysis_run_id' => $reviewAnalysisRun->id,
            'actor_type' => 'human',
            'actor_id' => $request->user()?->id,
            'action' => 'codex.follow-up.queued',
            'metadata_json' => [
                'kind' => 'user_text',
                'content' => $request->string('content')->toString(),
                'message' => $request->string('content')->toString(),
            ],
        ]);

        try {
            event(new ReviewAnalysisEventBroadcast($request->user(), $event));
        } catch (Throwable $throwable) {
            report($throwable);
        }

        return back();
    }
}
