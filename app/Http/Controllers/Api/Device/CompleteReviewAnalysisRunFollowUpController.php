<?php

namespace App\Http\Controllers\Api\Device;

use App\Events\ReviewAnalysisEventBroadcast;
use App\Events\ReviewAnalysisRunUpdated;
use App\Http\Controllers\Controller;
use App\Models\ActionLog;
use App\Models\ReviewAnalysisRun;
use App\Models\ReviewAnalysisRunFollowUp;
use App\Models\SignalsDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class CompleteReviewAnalysisRunFollowUpController extends Controller
{
    public function __invoke(Request $request, ReviewAnalysisRun $reviewAnalysisRun, ReviewAnalysisRunFollowUp $reviewAnalysisRunFollowUp): JsonResponse
    {
        /** @var SignalsDevice $device */
        $device = $request->attributes->get('signalsDevice');

        abort_unless($reviewAnalysisRun->user_id === $device->user_id, 403);
        abort_unless($reviewAnalysisRunFollowUp->review_analysis_run_id === $reviewAnalysisRun->id, 404);

        $failed = $request->boolean('failed');
        $summary = $request->string('summary')->toString() ?: null;
        $errorMessage = $request->string('error_message')->toString() ?: null;

        $reviewAnalysisRunFollowUp->forceFill([
            'status' => $failed ? 'failed' : 'completed',
            'summary' => $summary,
            'error_message' => $errorMessage,
            'completed_at' => now(),
        ])->save();

        $reviewAnalysisRun->forceFill([
            'status' => $failed ? 'failed' : 'completed',
            'summary' => $summary,
            'error_message' => $errorMessage,
            'completed_at' => now(),
        ])->save();

        $event = ActionLog::query()->create([
            'review_analysis_run_id' => $reviewAnalysisRun->id,
            'actor_type' => $failed ? 'system' : 'agent',
            'action' => $failed ? 'codex.follow-up.failed' : 'codex.follow-up.completed',
            'metadata_json' => [
                'message' => $failed
                    ? ($errorMessage ?: 'Codex follow-up failed.')
                    : ($summary ?: 'Codex completed the follow-up turn.'),
            ],
        ]);

        try {
            event(new ReviewAnalysisRunUpdated($reviewAnalysisRun));
            event(new ReviewAnalysisEventBroadcast($device->user, $event));
        } catch (Throwable $throwable) {
            report($throwable);
        }

        return response()->json(['ok' => true]);
    }
}
