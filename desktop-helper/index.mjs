import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { CodexAppServerClient } from './codex-app-server.mjs';

const serverUrl = process.env.SIGNALS_SERVER_URL;
const token = process.env.SIGNALS_DEVICE_TOKEN;
const pollIntervalMs = Number(process.env.SIGNALS_POLL_INTERVAL_MS ?? 4000);
const runOnce = process.env.SIGNALS_RUN_ONCE === '1';
const requireRun = process.env.SIGNALS_REQUIRE_RUN === '1';
const runCommand = process.env.SIGNALS_RUN_COMMAND ?? '';
const helperWorkspace = process.env.SIGNALS_CODEX_CWD ?? process.cwd();
const codexModel = process.env.SIGNALS_CODEX_MODEL ?? 'gpt-5.4';
const codexReasoningEffort =
    process.env.SIGNALS_CODEX_REASONING_EFFORT ?? 'medium';

if (!serverUrl || !token) {
    console.error(
        'Missing SIGNALS_SERVER_URL or SIGNALS_DEVICE_TOKEN environment variables.',
    );
    process.exit(1);
}

mkdirSync(helperWorkspace, { recursive: true });

async function request(path, options = {}) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            const response = await fetch(`${serverUrl}${path}`, {
                ...options,
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    ...(options.headers ?? {}),
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Request failed (${response.status}) for ${path}`,
                );
            }

            return response.json();
        } catch (error) {
            if (attempt === 2) {
                throw error;
            }

            await new Promise((resolve) => {
                setTimeout(resolve, 250 * (attempt + 1));
            });
        }
    }
}

async function postRunEvent(runId, payload) {
    await request(`/api/device/runs/${runId}/stream`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

async function completeRun(runId, payload) {
    await request(`/api/device/runs/${runId}/complete`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

async function updateRunSession(runId, payload) {
    await request(`/api/device/runs/${runId}/session`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

async function claimFollowUp(activeRunIds) {
    return request('/api/device/follow-ups/claim', {
        method: 'POST',
        body: JSON.stringify({
            active_run_ids: activeRunIds,
        }),
    });
}

async function completeFollowUp(runId, followUpId, payload) {
    await request(`/api/device/runs/${runId}/follow-ups/${followUpId}/complete`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

function limitText(text, max = 420) {
    if (!text) {
        return '';
    }

    return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function previewValue(value) {
    if (value == null) {
        return '';
    }

    if (typeof value === 'string') {
        return limitText(value);
    }

    try {
        return limitText(JSON.stringify(value));
    } catch {
        return limitText(String(value));
    }
}

function buildReviewAnalysisPrompt(basePrompt) {
    return `${basePrompt}

Use the signals MCP server as the source of truth for products, reviews, resources, and proposal writes.
Do not inspect the local filesystem or use shell commands for business data. Stay inside MCP unless a failure prevents it.

Required workflow:
1. Inspect the signals MCP server and recent reviews before you draft anything.
2. Use MCP tools and resources instead of inventing product or review details.
3. Normalize hidden tags and cluster repeated issues before you draft customer-facing proposals.
4. Record concise milestones with the log_action MCP tool when you confirm a meaningful pattern.
5. Create at most one high-confidence product copy proposal if the evidence is clear, and draft review responses only for genuinely negative reviews.
6. Mark the analyzed reviews as processed before you finish the run.
7. Do not apply or publish changes directly. Customer-facing output must go through proposal tools only.

Aim for a concrete fit-note style proposal when the review evidence supports it.`;
}

function buildStorefrontAdaptationPrompt(run) {
    return `${run.prompt}

Use the signals MCP server as the source of truth for product data, reviews, and proposal writes.
Stay inside the live Arrow.js proposal flow for this run. Do not inspect or modify shared Laravel or React storefront files unless a tool failure makes the live override path impossible.`.trim();
}

function buildUiRefinementPrompt(run) {
    return `${run.prompt}

Continue on the same Codex thread and refine the existing live Arrow.js proposal in place.
Do not switch this run into local repository edits. Keep changes inside the Signals MCP proposal tools unless the live tool path is unavailable.`.trim();
}

function buildDeveloperInstructions(kind) {
    if (kind === 'storefront_adaptation' || kind === 'ui_refinement') {
        return 'Operate as a live Signals Arrow.js storefront agent. Use the signals MCP server for product truth and proposal writes, keep work inside the live override flow, and avoid local repository edits for adaptation or refinement runs.';
    }

    return 'Operate as a merchant Signals analyst. Prefer MCP tools over freeform speculation, do not inspect the local repo or shell for product data, keep reasoning concise, and only produce customer-visible changes through proposal tools.';
}

function buildRunPrompt(run) {
    if (run.kind === 'storefront_adaptation') {
        return buildStorefrontAdaptationPrompt(run);
    }

    if (run.kind === 'ui_refinement') {
        return buildUiRefinementPrompt(run);
    }

    return buildReviewAnalysisPrompt(run.prompt);
}

function createRunMonitor() {
    let resolveCompletion;
    let rejectCompletion;

    const completion = new Promise((resolve, reject) => {
        resolveCompletion = resolve;
        rejectCompletion = reject;
    });

    return {
        completion,
        resolve: resolveCompletion,
        reject: rejectCompletion,
    };
}

function formatMcpStatusEvent(serverStatus) {
    return {
        action: 'mcp.server.ready',
        kind: 'status',
        message: `Codex connected to the ${serverStatus.name} MCP server and discovered ${Object.keys(serverStatus.tools ?? {}).length} tools.`,
        tool_name:
            Object.keys(serverStatus.tools ?? {}).sort()[0] ??
            'mcp__signals__connected',
        metadata: {
            server_name: serverStatus.name,
            auth_status: serverStatus.authStatus,
            tool_names: Object.keys(serverStatus.tools ?? {}).sort(),
            resource_names: (serverStatus.resources ?? []).map(
                (resource) => resource.name,
            ),
            resource_template_names: (serverStatus.resourceTemplates ?? []).map(
                (resource) => resource.name,
            ),
        },
    };
}

function formatQualifiedMcpToolName(item) {
    if (item.server && item.tool) {
        return `mcp__${item.server}__${item.tool}`;
    }

    if (typeof item.id === 'string' && item.id) {
        return item.id;
    }

    return 'mcp__signals__unknown';
}

function notificationToEvents(notification) {
    const method = notification.method;
    const params = notification.params ?? {};
    const itemId =
        params.item_id ??
        params.itemId ??
        params.item?.id ??
        params.id ??
        null;

    switch (method) {
        case 'agentMessage/delta': {
            const content =
                typeof params.delta === 'string'
                    ? params.delta
                    : typeof params.text === 'string'
                      ? params.text
                      : typeof params.content === 'string'
                        ? params.content
                        : '';

            if (content === '') {
                return [];
            }

            return [
                {
                    action: 'codex.message.delta',
                    kind: 'assistant_text_delta',
                    content,
                    message: content,
                    item_id: itemId,
                    metadata: {
                        item_id: itemId,
                    },
                },
            ];
        }
        case 'thread/started':
            return [
                {
                    action: 'codex.thread.started',
                    kind: 'status',
                    content: 'Started a local Codex app-server thread.',
                    message: 'Started a local Codex app-server thread.',
                    metadata: {
                        thread_id: params.thread?.id ?? null,
                    },
                },
            ];
        case 'turn/started':
            return [
                {
                    action: 'codex.turn.started',
                    kind: 'status',
                    content: 'Codex started the Signals analysis turn.',
                    message: 'Codex started the Signals analysis turn.',
                    metadata: {
                        turn_id: params.turn?.id ?? null,
                    },
                },
            ];
        case 'turn/plan/updated': {
            const steps = Array.isArray(params.plan)
                ? params.plan.map((step) => `${step.status}: ${step.step}`)
                : [];

            return [
                {
                    action: 'codex.plan.updated',
                    kind: 'status',
                    content: limitText(
                        params.explanation ||
                            steps.join(' | ') ||
                            'Codex updated its review analysis plan.',
                    ),
                    message: limitText(
                        params.explanation ||
                            steps.join(' | ') ||
                            'Codex updated its review analysis plan.',
                    ),
                    metadata: {
                        explanation: params.explanation ?? null,
                        steps,
                    },
                },
            ];
        }
        case 'item/started': {
            const item = params.item ?? {};
            const type = item.type;

            if (type === 'mcpToolCall') {
                const toolName = formatQualifiedMcpToolName(item);

                return [
                    {
                        action: 'mcp.tool.started',
                        kind: 'tool_call',
                        content:
                            item.server && item.tool
                                ? `Calling ${item.server}.${item.tool}`
                                : 'Calling a Signals MCP tool.',
                        message:
                            item.server && item.tool
                                ? `Calling ${item.server}.${item.tool}`
                                : 'Calling a Signals MCP tool.',
                        tool_id: item.id ?? null,
                        tool_name: toolName,
                        metadata: {
                            server_name: item.server,
                            tool_name: toolName,
                            arguments: item.arguments ?? {},
                        },
                    },
                ];
            }

            if (type === 'commandExecution') {
                return [
                    {
                        action: 'codex.command.started',
                        kind: 'tool_call',
                        content: String(item.command ?? ''),
                        message: `Running local command: ${item.command}`,
                        tool_id: item.id ?? null,
                        tool_name: 'bash',
                        metadata: {
                            command: item.command,
                            cwd: item.cwd ?? null,
                        },
                    },
                ];
            }

            if (type === 'webSearch') {
                return [
                    {
                        action: 'codex.web-search.started',
                        kind: 'tool_call',
                        content: `Running web search: ${item.query}`,
                        message: `Running web search: ${item.query}`,
                        tool_id: item.id ?? null,
                        tool_name: 'web_search',
                        metadata: {
                            query: item.query,
                        },
                    },
                ];
            }

            if (type === 'fileChange') {
                const changes = Array.isArray(item.changes) ? item.changes : [];

                return changes.map((change) => ({
                    action: 'codex.file-change.started',
                    kind: 'tool_call',
                    content: `Preparing ${change.kind ?? 'change'} for ${change.path ?? 'file'}.`,
                    message: `Preparing ${change.kind ?? 'change'} for ${change.path ?? 'file'}.`,
                    tool_id: item.id ?? null,
                    tool_name: 'file_change',
                    metadata: {
                        path: change.path ?? null,
                        change_kind: change.kind ?? null,
                        diff: change.diff ?? null,
                    },
                }));
            }

            return [];
        }
        case 'item/completed': {
            const item = params.item ?? {};
            const type = item.type;

            if (type === 'agentMessage') {
                return [
                    {
                        action: 'codex.message',
                        kind: 'assistant_text',
                        content:
                            item.text ?? 'Codex returned an assistant message.',
                        message:
                            item.text ?? 'Codex returned an assistant message.',
                        item_id: item.id ?? itemId,
                    },
                ];
            }

            if (type === 'mcpToolCall') {
                const toolName = formatQualifiedMcpToolName(item);

                return [
                    {
                        action: 'mcp.tool.completed',
                        kind: 'tool_result',
                        content:
                            previewValue(
                                item.result?.structuredContent ??
                                    item.result?.content,
                            ) || 'Completed a Signals MCP tool call.',
                        message:
                            previewValue(
                                item.result?.structuredContent ??
                                    item.result?.content,
                            ) || 'Completed a Signals MCP tool call.',
                        tool_id: item.id ?? null,
                        tool_name: toolName,
                        metadata: {
                            server_name: item.server,
                            tool_name: toolName,
                            status: item.status ?? null,
                        },
                    },
                ];
            }

            if (type === 'commandExecution') {
                return [
                    {
                        action: 'codex.command.completed',
                        kind: 'tool_result',
                        content:
                            previewValue(item.aggregatedOutput) ||
                            `Command exited with status ${item.status ?? 'unknown'}.`,
                        message:
                            previewValue(item.aggregatedOutput) ||
                            `Command exited with status ${item.status ?? 'unknown'}.`,
                        tool_id: item.id ?? null,
                        tool_name: 'bash',
                        metadata: {
                            exit_code: item.exitCode ?? null,
                            status: item.status ?? null,
                        },
                    },
                ];
            }

            if (type === 'fileChange') {
                const changes = Array.isArray(item.changes) ? item.changes : [];

                return changes.map((change) => ({
                    action: 'codex.file-change.completed',
                    kind: 'tool_result',
                    content: `Modified ${change.path ?? 'file'}.`,
                    message: `Modified ${change.path ?? 'file'}.`,
                    tool_id: item.id ?? null,
                    tool_name: 'file_change',
                    is_error:
                        item.status === 'failed' || item.status === 'declined',
                    metadata: {
                        path: change.path ?? null,
                        status: item.status ?? null,
                    },
                }));
            }

            if (type === 'dynamicToolCall') {
                const content = Array.isArray(item.contentItems)
                    ? item.contentItems
                          .map((contentItem) => contentItem?.text ?? '')
                          .filter(Boolean)
                          .join('\n')
                    : '';

                return [
                    {
                        action: 'codex.dynamic-tool.completed',
                        kind: 'tool_result',
                        content,
                        message: content || 'Completed a dynamic tool call.',
                        tool_id: item.id ?? null,
                        tool_name: item.name ?? 'dynamic_tool',
                        is_error:
                            item.status === 'failed' || item.success === false,
                        metadata: {
                            status: item.status ?? null,
                            success: item.success ?? null,
                        },
                    },
                ];
            }

            return [];
        }
        case 'error':
            return [
                {
                    action: 'codex.error',
                    kind: 'status',
                    content:
                        params.message ?? 'Codex app-server reported an error.',
                    message:
                        params.message ?? 'Codex app-server reported an error.',
                },
            ];
        default:
            return [];
    }
}

function shellCommand(prompt, mcpUrl) {
    if (!runCommand) {
        return null;
    }

    return runCommand
        .replaceAll('{prompt}', JSON.stringify(prompt))
        .replaceAll('{mcp_url}', mcpUrl);
}

const activeRunSessions = new Map();

async function executeCustomCommand(run) {
    await postRunEvent(run.id, {
        action: 'helper.custom-command',
        kind: 'status',
        content: 'Launching the configured SIGNALS_RUN_COMMAND.',
        message: 'Launching the configured SIGNALS_RUN_COMMAND.',
    });

    const command = shellCommand(run.prompt, run.mcp_url);

    await new Promise((resolve, reject) => {
        const child = spawn(command, {
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
                ...process.env,
                SIGNALS_PROMPT: run.prompt,
                SIGNALS_MCP_URL: run.mcp_url,
                SIGNALS_RUN_ID: String(run.id),
            },
        });

        child.stdout.on('data', async (chunk) => {
            const message = chunk.toString().trim();

            if (!message) {
                return;
            }

            try {
                await postRunEvent(run.id, {
                    action: 'codex.stdout',
                    kind: 'assistant_text',
                    content: message,
                    message,
                });
            } catch (error) {
                console.error(error);
            }
        });

        child.stderr.on('data', async (chunk) => {
            const message = chunk.toString().trim();

            if (!message) {
                return;
            }

            try {
                await postRunEvent(run.id, {
                    action: 'codex.stderr',
                    kind: 'status',
                    content: message,
                    message,
                });
            } catch (error) {
                console.error(error);
            }
        });

        child.on('error', reject);
        child.on('close', async (code) => {
            try {
                if (code === 0) {
                    await completeRun(run.id, {
                        summary:
                            'Custom Signals run command completed successfully.',
                    });
                    resolve();

                    return;
                }

                await completeRun(run.id, {
                    failed: true,
                    error_message: `Custom Signals run command exited with code ${code ?? 1}.`,
                });
                reject(new Error(`Command exited with code ${code ?? 1}`));
            } catch (error) {
                reject(error);
            }
        });
    });
}

class ActiveRunSession {
    constructor(run) {
        this.run = run;
        this.threadId = null;
        this.turnMonitor = null;
        this.closed = false;
        this.client = new CodexAppServerClient({
            cwd: helperWorkspace,
            mcpUrl: run.mcp_url,
            model: codexModel,
            reasoningEffort: codexReasoningEffort,
        });
        this.stopNotificationStream = this.client.onNotification(
            (notification) => {
                if (
                    notification.method === 'turn/completed' &&
                    this.turnMonitor !== null
                ) {
                    const status =
                        notification.params?.turn?.status ?? 'failed';

                    if (status === 'completed') {
                        this.turnMonitor.resolve(
                            notification.params?.turn ?? {},
                        );
                    } else {
                        this.turnMonitor.reject(
                            new Error(
                                notification.params?.turn?.error?.message ??
                                    `Codex turn finished with status ${status}.`,
                            ),
                        );
                    }
                }

                for (const event of notificationToEvents(notification)) {
                    void postRunEvent(this.run.id, event).catch((error) => {
                        console.error(error);
                    });
                }
            },
        );
        this.stopLifecycleStream = this.client.onLifecycle((event) => {
            const message =
                event.type === 'stderr'
                    ? event.message
                    : event.type === 'error'
                      ? event.message
                      : `Codex app-server exited with code ${event.code}.`;

            void postRunEvent(this.run.id, {
                action:
                    event.type === 'stderr'
                        ? 'codex.stderr'
                        : event.type === 'error'
                          ? 'codex.error'
                          : 'codex.closed',
                kind: 'status',
                content: message,
                message,
            }).catch((error) => {
                console.error(error);
            });

            if (event.type !== 'stderr') {
                this.closed = true;
                activeRunSessions.delete(this.run.id);
                void updateRunSession(this.run.id, {
                    session_status: 'closed',
                }).catch((error) => {
                    console.error(error);
                });
            }

            if (event.type === 'error' && this.turnMonitor !== null) {
                this.turnMonitor.reject(new Error(event.message));
            }
        });
    }

    async start() {
        await postRunEvent(this.run.id, {
            action: 'helper.codex.starting',
            kind: 'status',
            content: 'Starting a local Codex app-server session for Signals.',
            message: 'Starting a local Codex app-server session for Signals.',
        });

        await this.client.start();

        const statusResponse = await this.client.listMcpServerStatus();
        const reviewOpsServer = (statusResponse.data ?? []).find((server) => {
            const toolNames = Object.keys(server.tools ?? {});

            return (
                server.name === 'signals' ||
                server.name === 'Signals Server' ||
                toolNames.some((toolName) =>
                    toolName.includes('create_product_copy_change_proposal'),
                )
            );
        });

        if (!reviewOpsServer) {
            throw new Error(
                'Codex could not discover the signals MCP server. Check the MCP URL and device token.',
            );
        }

        await postRunEvent(this.run.id, formatMcpStatusEvent(reviewOpsServer));

        const threadResponse = await this.client.startThread({
            developerInstructions: buildDeveloperInstructions(this.run.kind),
            baseInstructions: null,
        });

        this.threadId = threadResponse.thread.id;

        await postRunEvent(this.run.id, {
            action: 'codex.thread.ready',
            kind: 'status',
            content: 'Codex thread is ready. Starting the Signals turn now.',
            message: 'Codex thread is ready. Starting the Signals turn now.',
            metadata: {
                thread_id: this.threadId,
            },
        });

        await updateRunSession(this.run.id, {
            thread_id: this.threadId,
            session_status: 'active',
        });
    }

    async runPrompt(prompt) {
        if (this.threadId === null) {
            throw new Error('Codex thread is not ready for this Signals run.');
        }

        if (this.turnMonitor !== null) {
            throw new Error('Codex is already processing a turn for this run.');
        }

        this.turnMonitor = createRunMonitor();

        try {
            await this.client.startTurn({
                threadId: this.threadId,
                prompt,
            });

            return await this.turnMonitor.completion;
        } finally {
            this.turnMonitor = null;
        }
    }

    isBusy() {
        return this.turnMonitor !== null;
    }

    async close() {
        if (this.closed) {
            return;
        }

        this.closed = true;
        activeRunSessions.delete(this.run.id);
        this.stopNotificationStream();
        this.stopLifecycleStream();
        this.client.stop();

        try {
            await updateRunSession(this.run.id, {
                session_status: 'closed',
            });
        } catch (error) {
            console.error(error);
        }
    }
}

async function executeCodexRun(run) {
    const session = new ActiveRunSession(run);

    try {
        await session.start();

        const turnResult = await session.runPrompt(buildRunPrompt(run));

        await completeRun(run.id, {
            summary:
                turnResult.summary ??
                'Local Codex run completed and streamed events back into Signals.',
        });

        activeRunSessions.set(run.id, session);

        return session;
    } catch (error) {
        await session.close();

        throw error;
    }
}

async function executeRun(run) {
    await postRunEvent(run.id, {
        action: 'helper.started',
        kind: 'status',
        content: 'Local helper claimed the run and is preparing Codex.',
        message: 'Local helper claimed the run and is preparing Codex.',
    });

    if (runCommand) {
        await executeCustomCommand(run);

        return null;
    }

    return executeCodexRun(run);
}

async function tickRuns() {
    const response = await request('/api/device/runs/claim', {
        method: 'POST',
        body: JSON.stringify({}),
    });

    if (!response.run) {
        return false;
    }

    try {
        await executeRun(response.run);
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : 'Unknown helper execution error.';

        await completeRun(response.run.id, {
            failed: true,
            error_message: message,
        });

        throw error;
    }

    return true;
}

async function tickFollowUps() {
    const activeRunIds = [...activeRunSessions.values()]
        .filter((session) => !session.closed && !session.isBusy())
        .map((session) => session.run.id);

    if (activeRunIds.length === 0) {
        return false;
    }

    const response = await claimFollowUp(activeRunIds);

    if (!response.follow_up) {
        return false;
    }

    const session = activeRunSessions.get(response.follow_up.review_analysis_run_id);

    if (!session || session.closed) {
        await completeFollowUp(
            response.follow_up.review_analysis_run_id,
            response.follow_up.id,
            {
                failed: true,
                error_message:
                    'The helper no longer has the original Codex session available for this run.',
            },
        );

        return true;
    }

    try {
        const turnResult = await session.runPrompt(response.follow_up.content);

        await completeFollowUp(
            response.follow_up.review_analysis_run_id,
            response.follow_up.id,
            {
                summary:
                    turnResult.summary ??
                    'Codex completed the follow-up turn on the active Signals session.',
            },
        );
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : 'Unknown helper execution error.';

        await completeFollowUp(
            response.follow_up.review_analysis_run_id,
            response.follow_up.id,
            {
                failed: true,
                error_message: message,
            },
        );

        if (session.closed) {
            await session.close();
        }

        throw error;
    }

    return true;
}

console.log('Signals helper started.');

async function main() {
    if (runOnce) {
        try {
            const handledRun = await tickRuns();

            if (!handledRun && requireRun) {
                console.error(
                    'No queued Signals run was available for the helper.',
                );
                process.exit(2);
            }

            process.exit(0);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }

    async function loop() {
        try {
            const handledRun = await tickRuns();

            if (!handledRun) {
                await tickFollowUps();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setTimeout(loop, pollIntervalMs);
        }
    }

    await loop();
}

void main();
