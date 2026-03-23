<?php

use App\Models\ActionLog;
use App\Models\User;

test('admin can view the audit log page', function (): void {
    $admin = User::factory()->create();

    ActionLog::factory()->create([
        'actor_type' => 'agent',
        'action' => 'proposal.created',
        'metadata_json' => [
            'message' => 'Drafted a new fit note proposal for Premium Hoodie.',
        ],
    ]);

    $this->actingAs($admin)
        ->get(route('admin.audit-log'))
        ->assertSuccessful()
        ->assertSee('proposal.created')
        ->assertSee('Drafted a new fit note proposal for Premium Hoodie.');
});
