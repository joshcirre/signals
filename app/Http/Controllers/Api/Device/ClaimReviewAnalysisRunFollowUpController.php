<?php

namespace App\Http\Controllers\Api\Device;

use App\Events\ReviewAnalysisEventBroadcast;
use App\Events\ReviewAnalysisRunUpdated;
use App\Http\Controllers\Controller;
use App\Models\ActionLog;
use App\Models\ReviewAnalysisRunFollowUp;
use App\Models\SignalsDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class ClaimReviewAnalysisRunFollowUpController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var SignalsDevice $device */
        $device = $request->attributes->get('signalsDevice');
        $activeRunIds = collect($request->input('active_run_ids', []))
            ->filter(fn (mixed $value): bool => is_numeric($value))
            ->map(fn (mixed $value): int => (int) $value)
            ->values();

        if ($activeRunIds->isEmpty()) {
            return response()->json([
                'ok' => true,
                'follow_up' => null,
            ]);
        }

        $followUp = ReviewAnalysisRunFollowUp::query()
            ->where('status', 'queued')
            ->whereIn('review_analysis_run_id', $activeRunIds)
            ->whereHas('run', fn ($query) => $query->where('user_id', $device->user_id))
            ->oldest('requested_at')
            ->first();

        if ($followUp === null) {
            return response()->json([
                'ok' => true,
                'follow_up' => null,
            ]);
        }

        $followUp->forceFill([
            'status' => 'running',
            'started_at' => now(),
        ])->save();

        $followUp->run->forceFill([
            'status' => 'running',
            'error_message' => null,
        ])->save();

        $event = ActionLog::query()->create([
            'review_analysis_run_id' => $followUp->review_analysis_run_id,
            'actor_type' => 'system',
            'action' => 'codex.follow-up.started',
            'metadata_json' => [
                'message' => 'Codex is continuing the same session with a follow-up request.',
            ],
        ]);

        try {
            event(new ReviewAnalysisRunUpdated($followUp->run));
            event(new ReviewAnalysisEventBroadcast($device->user, $event));
        } catch (Throwable $throwable) {
            report($throwable);
        }

        return response()->json([
            'ok' => true,
            'follow_up' => [
                'id' => $followUp->id,
                'review_analysis_run_id' => $followUp->review_analysis_run_id,
                'content' => $followUp->content,
            ],
        ]);
    }
}
