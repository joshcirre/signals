<?php

namespace App\Http\Controllers\Api\Device;

use App\Events\ReviewAnalysisRunUpdated;
use App\Http\Controllers\Controller;
use App\Models\ReviewAnalysisRun;
use App\Models\SignalsDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class UpdateReviewAnalysisRunSessionController extends Controller
{
    public function __invoke(Request $request, ReviewAnalysisRun $reviewAnalysisRun): JsonResponse
    {
        /** @var SignalsDevice $device */
        $device = $request->attributes->get('signalsDevice');

        abort_unless($reviewAnalysisRun->user_id === $device->user_id, 403);

        $threadId = $request->string('thread_id')->toString();
        $sessionStatus = $request->string('session_status')->toString();

        $reviewAnalysisRun->forceFill([
            'codex_thread_id' => $threadId !== '' ? $threadId : $reviewAnalysisRun->codex_thread_id,
            'codex_session_status' => $sessionStatus !== '' ? $sessionStatus : $reviewAnalysisRun->codex_session_status,
        ])->save();

        try {
            event(new ReviewAnalysisRunUpdated($reviewAnalysisRun));
        } catch (Throwable $throwable) {
            report($throwable);
        }

        return response()->json(['ok' => true]);
    }
}
