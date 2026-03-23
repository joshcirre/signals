<?php

namespace App\Actions\Signals;

use App\Events\ReviewAnalysisEventBroadcast;
use App\Events\ReviewAnalysisRunUpdated;
use App\Models\ActionLog;
use App\Models\ReviewAnalysisRun;
use App\Models\User;
use Throwable;

class QueueReviewAnalysisRunAction
{
    public function handle(
        User $user,
        ?string $prompt = null,
        ?string $message = null,
    ): ReviewAnalysisRun {
        $run = ReviewAnalysisRun::query()->create([
            'user_id' => $user->id,
            'status' => 'queued',
            'prompt' => $prompt ?: 'Analyze the latest apparel reviews, confirm any repeated fit problems, and prepare only merchant-facing proposals with a strong preference for a single fit-note update when the evidence is clear.',
            'requested_at' => now(),
        ]);

        $event = ActionLog::query()->create([
            'review_analysis_run_id' => $run->id,
            'actor_type' => 'system',
            'action' => 'run.queued',
            'metadata_json' => [
                'message' => $message ?: 'Queued Signals run and waiting for a connected local helper to claim it.',
            ],
        ]);

        try {
            event(new ReviewAnalysisRunUpdated($run));
            event(new ReviewAnalysisEventBroadcast($user, $event));
        } catch (Throwable $throwable) {
            report($throwable);
        }

        return $run;
    }
}
