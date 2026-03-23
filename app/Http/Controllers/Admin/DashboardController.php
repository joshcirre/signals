<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActionLog;
use App\Models\Product;
use App\Models\Proposal;
use App\Models\Review;
use App\Models\ReviewAnalysisRun;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $latestRun = ReviewAnalysisRun::query()->latest()->first();

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'products' => Product::query()->count(),
                'new_reviews' => Review::query()->whereNull('processed_at')->count(),
                'negative_reviews' => Review::query()->where('rating', '<=', 3)->count(),
                'pending_proposals' => Proposal::query()->where('status', 'pending')->count(),
            ],
            'latestRun' => $latestRun ? [
                'id' => $latestRun->id,
                'status' => $latestRun->status,
                'summary' => $latestRun->summary,
                'requested_at' => $latestRun->requested_at?->diffForHumans(),
            ] : null,
            'recentActions' => ActionLog::query()
                ->latest()
                ->limit(6)
                ->get()
                ->map(fn (ActionLog $actionLog) => [
                    'id' => $actionLog->id,
                    'action' => $actionLog->action,
                    'actor_type' => $actionLog->actor_type,
                    'message' => $actionLog->metadata_json['message'] ?? null,
                    'created_at' => $actionLog->created_at->diffForHumans(),
                ]),
        ]);
    }
}
