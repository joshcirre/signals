<?php

use App\Models\ActionLog;
use App\Models\Proposal;
use App\Models\User;

test('admin can edit a pending product copy proposal', function () {
    $admin = User::factory()->create();
    $proposal = Proposal::factory()->create([
        'payload_json' => [
            'field' => 'fit_note',
            'before' => null,
            'after' => 'Original fit note draft.',
            'supporting_review_ids' => [],
        ],
        'rationale' => 'Original rationale.',
        'confidence' => 0.850,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.proposals.update', $proposal), [
            'content' => 'Updated fit note draft for shoppers.',
            'rationale' => 'Updated rationale after manual review.',
            'confidence' => 0.94,
        ])
        ->assertRedirect();

    $proposal->refresh();

    expect($proposal->payload_json['after'])->toBe('Updated fit note draft for shoppers.')
        ->and($proposal->rationale)->toBe('Updated rationale after manual review.')
        ->and((float) $proposal->confidence)->toBe(0.94)
        ->and(ActionLog::query()->where('action', 'proposal.edited')->exists())->toBeTrue();
});
