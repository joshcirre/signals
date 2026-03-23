<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActionLog;
use App\Models\ReviewAnalysisRun;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewAnalysisRunShowController extends Controller
{
    public function __invoke(Request $request, ReviewAnalysisRun $reviewAnalysisRun): Response
    {
        abort_if($reviewAnalysisRun->user_id !== $request->user()?->id, 404);

        return Inertia::render('admin/review-runs/show', [
            'run' => [
                'id' => $reviewAnalysisRun->id,
                'status' => $reviewAnalysisRun->status,
                'summary' => $reviewAnalysisRun->summary,
                'prompt' => $reviewAnalysisRun->prompt,
                'error_message' => $reviewAnalysisRun->error_message,
                'requested_at' => $reviewAnalysisRun->requested_at?->toIso8601String(),
                'started_at' => $reviewAnalysisRun->started_at?->toIso8601String(),
                'completed_at' => $reviewAnalysisRun->completed_at?->toIso8601String(),
                'events' => $reviewAnalysisRun->actionLogs()
                    ->oldest()
                    ->limit(250)
                    ->get()
                    ->map(fn (ActionLog $actionLog): array => [
                        'id' => $actionLog->id,
                        'review_analysis_run_id' => $actionLog->review_analysis_run_id,
                        'action' => $actionLog->action,
                        'actor_type' => $actionLog->actor_type,
                        'kind' => $actionLog->metadata_json['kind'] ?? null,
                        'content' => $actionLog->metadata_json['content'] ?? ($actionLog->metadata_json['message'] ?? null),
                        'tool_id' => $actionLog->metadata_json['tool_id'] ?? null,
                        'tool_name' => $actionLog->metadata_json['tool_name'] ?? null,
                        'item_id' => $actionLog->metadata_json['item_id'] ?? null,
                        'is_error' => (bool) ($actionLog->metadata_json['is_error'] ?? false),
                        'metadata' => $actionLog->metadata_json ?? [],
                        'created_at' => $actionLog->created_at->toIso8601String(),
                    ]),
            ],
        ]);
    }
}
