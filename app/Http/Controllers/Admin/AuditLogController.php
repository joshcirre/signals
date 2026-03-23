<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActionLog;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('admin/audit-log', [
            'entries' => ActionLog::query()
                ->latest()
                ->limit(50)
                ->get()
                ->map(fn (ActionLog $actionLog): array => [
                    'id' => $actionLog->id,
                    'action' => $actionLog->action,
                    'actor_type' => $actionLog->actor_type,
                    'target_type' => $actionLog->target_type,
                    'target_id' => $actionLog->target_id,
                    'metadata' => $actionLog->metadata_json ?? [],
                    'created_at' => $actionLog->created_at->toIso8601String(),
                ]),
        ]);
    }
}
