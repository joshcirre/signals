<?php

namespace App\Http\Controllers\Api\Device;

use App\Events\ReviewAnalysisEventBroadcast;
use App\Events\ReviewAnalysisRunUpdated;
use App\Http\Controllers\Controller;
use App\Models\ActionLog;
use App\Models\ReviewAnalysisRun;
use App\Models\ReviewOpsDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClaimReviewAnalysisRunController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var ReviewOpsDevice $device */
        $device = $request->attributes->get('reviewOpsDevice');

        $run = ReviewAnalysisRun::query()
            ->where('user_id', $device->user_id)
            ->where('status', 'queued')
            ->orderBy('requested_at')
            ->first();

        if ($run === null) {
            return response()->json([
                'ok' => true,
                'run' => null,
            ]);
        }

        $run->forceFill([
            'review_ops_device_id' => $device->id,
            'status' => 'running',
            'started_at' => now(),
        ])->save();

        $event = ActionLog::query()->create([
            'review_analysis_run_id' => $run->id,
            'actor_type' => 'system',
            'action' => 'run.claimed',
            'metadata_json' => [
                'message' => 'Local helper claimed the queued ReviewOps run.',
                'device_name' => $device->name,
            ],
        ]);

        ReviewAnalysisRunUpdated::dispatch($run);
        ReviewAnalysisEventBroadcast::dispatch($device->user, $event);

        return response()->json([
            'ok' => true,
            'run' => [
                'id' => $run->id,
                'prompt' => $run->prompt,
                'mcp_url' => route('review-ops.mcp'),
            ],
        ]);
    }
}
