<?php

namespace App\Mcp\Tools;

use App\Models\ActionLog;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Write a structured ReviewOps action log entry for auditability.')]
class LogActionTool extends Tool
{
    public function handle(Request $request): Response
    {
        $log = ActionLog::query()->create([
            'review_analysis_run_id' => is_numeric($request->get('review_analysis_run_id'))
                ? (int) $request->get('review_analysis_run_id')
                : null,
            'actor_type' => $request->string('actor_type')->toString() ?: 'agent',
            'action' => $request->string('action')->toString(),
            'metadata_json' => [
                'message' => $request->string('message')->toString(),
            ],
        ]);

        return Response::json([
            'action_log_id' => $log->id,
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'review_analysis_run_id' => $schema->integer(),
            'actor_type' => $schema->string()->enum(['agent', 'human', 'system']),
            'action' => $schema->string()->required(),
            'message' => $schema->string()->required(),
        ];
    }
}
