<?php

namespace App\Http\Controllers\Api\Device;

use App\Events\ReviewAnalysisEventBroadcast;
use App\Http\Controllers\Controller;
use App\Models\ActionLog;
use App\Models\ReviewAnalysisRun;
use App\Models\SignalsDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class RecordReviewAnalysisEventController extends Controller
{
    public function __invoke(Request $request, ReviewAnalysisRun $reviewAnalysisRun): JsonResponse
    {
        /** @var SignalsDevice $device */
        $device = $request->attributes->get('signalsDevice');

        abort_unless($reviewAnalysisRun->user_id === $device->user_id, 403);

        $metadata = $request->input('metadata', []);

        if (! is_array($metadata)) {
            $metadata = [];
        }

        $event = ActionLog::query()->create([
            'review_analysis_run_id' => $reviewAnalysisRun->id,
            'actor_type' => 'agent',
            'action' => $request->string('action')->toString(),
            'metadata_json' => array_filter([
                ...$metadata,
                'message' => $request->string('message')->toString() ?: ($metadata['message'] ?? null),
                'tool_name' => $request->string('tool_name')->toString() ?: ($metadata['tool_name'] ?? null),
                'kind' => $request->string('kind')->toString() ?: ($metadata['kind'] ?? null),
            ], static fn (mixed $value): bool => $value !== null),
        ]);

        try {
            ReviewAnalysisEventBroadcast::dispatch($device->user, $event);
        } catch (Throwable $exception) {
            report($exception);
        }

        return response()->json(['ok' => true]);
    }
}
