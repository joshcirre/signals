<?php

namespace App\Http\Controllers\Api\Device;

use App\Events\ReviewAnalysisEventBroadcast;
use App\Events\ReviewAnalysisRunUpdated;
use App\Http\Controllers\Controller;
use App\Models\ActionLog;
use App\Models\ReviewAnalysisRun;
use App\Models\SignalsDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class CompleteReviewAnalysisRunController extends Controller
{
    public function __invoke(Request $request, ReviewAnalysisRun $reviewAnalysisRun): JsonResponse
    {
        /** @var SignalsDevice $device */
        $device = $request->attributes->get('signalsDevice');

        abort_unless($reviewAnalysisRun->user_id === $device->user_id, 403);

        $failed = $request->boolean('failed');

        $reviewAnalysisRun->forceFill([
            'status' => $failed ? 'failed' : 'completed',
            'summary' => $request->string('summary')->toString() ?: null,
            'error_message' => $request->string('error_message')->toString() ?: null,
            'completed_at' => now(),
        ])->save();

        $event = ActionLog::query()->create([
            'review_analysis_run_id' => $reviewAnalysisRun->id,
            'actor_type' => $failed ? 'system' : 'agent',
            'action' => $failed ? 'run.failed' : 'run.completed',
            'metadata_json' => [
                'message' => $failed
                    ? ($reviewAnalysisRun->error_message ?: 'The helper reported a failure.')
                    : ($reviewAnalysisRun->summary ?: 'The helper completed the Signals run.'),
            ],
        ]);

        try {
            ReviewAnalysisRunUpdated::dispatch($reviewAnalysisRun);
            ReviewAnalysisEventBroadcast::dispatch($device->user, $event);
        } catch (Throwable $exception) {
            report($exception);
        }

        return response()->json(['ok' => true]);
    }
}
