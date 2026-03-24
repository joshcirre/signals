<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Proposal;
use App\Support\SignalsProposalPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProposalQueueController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $status = $request->string('status')->toString() ?: 'pending';

        return Inertia::render('admin/proposals', [
            'filters' => [
                'status' => $status,
            ],
            'proposals' => Proposal::query()
                ->when($status !== 'all', fn ($query) => $query->where('status', $status))
                ->latest()
                ->limit(30)
                ->get()
                ->map(fn (Proposal $proposal): array => SignalsProposalPresenter::present($proposal)),
        ]);
    }
}
