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

        $kind = $request->string('kind')->toString() ?: ($metadata['kind'] ?? 'status');
        $content = $request->string('content')->toString() ?: ($metadata['content'] ?? null);
        $message = $request->string('message')->toString() ?: ($metadata['message'] ?? $content);
        $toolId = $request->string('tool_id')->toString() ?: ($metadata['tool_id'] ?? null);
        $toolName = $request->string('tool_name')->toString() ?: ($metadata['tool_name'] ?? null);
        $itemId = $request->string('item_id')->toString() ?: ($metadata['item_id'] ?? null);
        $isError = $request->boolean('is_error') || (bool) ($metadata['is_error'] ?? false);
        $action = $request->string('action')->toString() ?: ($kind === 'assistant_text' ? 'codex.message' : 'signals.stream.chunk');

        $event = ActionLog::query()->create([
            'review_analysis_run_id' => $reviewAnalysisRun->id,
            'actor_type' => 'agent',
            'action' => $action,
            'metadata_json' => array_filter([
                ...$metadata,
                'message' => $message,
                'content' => $content,
                'tool_id' => $toolId,
                'tool_name' => $toolName,
                'item_id' => $itemId,
                'kind' => $kind,
                'is_error' => $isError,
            ], static fn (mixed $value): bool => $value !== null),
        ]);

        try {
            event(new ReviewAnalysisEventBroadcast($device->user, $event));
        } catch (Throwable $throwable) {
            report($throwable);
        }

        return response()->json(['ok' => true]);
    }
}
