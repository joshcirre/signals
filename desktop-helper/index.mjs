import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CodexAppServerClient } from "./codex-app-server.mjs";

const serverUrl = process.env.REVIEWOPS_SERVER_URL;
const token = process.env.REVIEWOPS_DEVICE_TOKEN;
const pollIntervalMs = Number(process.env.REVIEWOPS_POLL_INTERVAL_MS ?? 4000);
const runOnce = process.env.REVIEWOPS_RUN_ONCE === "1";
const requireRun = process.env.REVIEWOPS_REQUIRE_RUN === "1";
const runCommand = process.env.REVIEWOPS_RUN_COMMAND ?? "";
const helperWorkspace = process.env.REVIEWOPS_CODEX_CWD ?? join(tmpdir(), "reviewops-helper");
const codexModel = process.env.REVIEWOPS_CODEX_MODEL ?? "gpt-5.4";
const codexReasoningEffort =
  process.env.REVIEWOPS_CODEX_REASONING_EFFORT ?? "medium";

if (!serverUrl || !token) {
  console.error(
    "Missing REVIEWOPS_SERVER_URL or REVIEWOPS_DEVICE_TOKEN environment variables.",
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
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(options.headers ?? {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status}) for ${path}`);
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
  await request(`/api/device/runs/${runId}/events`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function completeRun(runId, payload) {
  await request(`/api/device/runs/${runId}/complete`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function limitText(text, max = 420) {
  if (!text) {
    return "";
  }

  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function previewValue(value) {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return limitText(value);
  }

  try {
    return limitText(JSON.stringify(value));
  } catch {
    return limitText(String(value));
  }
}

function buildAnalysisPrompt(basePrompt) {
  return `${basePrompt}

Use the reviewops MCP server as the source of truth for products, reviews, resources, and proposal writes.
Do not inspect the local filesystem or use shell commands for business data. Stay inside MCP unless a failure prevents it.

Required workflow:
1. Inspect the reviewops MCP server and recent reviews before you draft anything.
2. Use MCP tools and resources instead of inventing product or review details.
3. Normalize hidden tags and cluster repeated issues before you draft customer-facing proposals.
4. Record concise milestones with the log_action MCP tool when you confirm a meaningful pattern.
5. Create at most one high-confidence product copy proposal if the evidence is clear, and draft review responses only for genuinely negative reviews.
6. Mark the analyzed reviews as processed before you finish the run.
7. Do not apply or publish changes directly. Customer-facing output must go through proposal tools only.

Aim for a concrete fit-note style proposal when the review evidence supports it.`;
}

function buildDeveloperInstructions() {
  return "Operate as a merchant review-ops analyst. Prefer MCP tools over freeform speculation, do not inspect the local repo or shell for product data, keep reasoning concise, and only produce customer-visible changes through proposal tools.";
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
    action: "mcp.server.ready",
    kind: "status",
    message: `Codex connected to the ${serverStatus.name} MCP server and discovered ${Object.keys(serverStatus.tools ?? {}).length} tools.`,
    tool_name:
      Object.keys(serverStatus.tools ?? {}).sort()[0] ?? "mcp__reviewops__connected",
    metadata: {
      server_name: serverStatus.name,
      auth_status: serverStatus.authStatus,
      tool_names: Object.keys(serverStatus.tools ?? {}).sort(),
      resource_names: (serverStatus.resources ?? []).map((resource) => resource.name),
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

  if (typeof item.id === "string" && item.id) {
    return item.id;
  }

  return "mcp__reviewops__unknown";
}

function notificationToEvents(notification) {
  const method = notification.method;
  const params = notification.params ?? {};

  switch (method) {
    case "thread/started":
      return [
        {
          action: "codex.thread.started",
          kind: "status",
          message: "Started a local Codex app-server thread.",
          metadata: {
            thread_id: params.thread?.id ?? null,
          },
        },
      ];
    case "turn/started":
      return [
        {
          action: "codex.turn.started",
          kind: "status",
          message: "Codex started the ReviewOps analysis turn.",
          metadata: {
            turn_id: params.turn?.id ?? null,
          },
        },
      ];
    case "turn/plan/updated": {
      const steps = Array.isArray(params.plan)
        ? params.plan.map((step) => `${step.status}: ${step.step}`)
        : [];

      return [
        {
          action: "codex.plan.updated",
          kind: "status",
          message: limitText(
            params.explanation ||
              steps.join(" | ") ||
              "Codex updated its review analysis plan.",
          ),
          metadata: {
            explanation: params.explanation ?? null,
            steps,
          },
        },
      ];
    }
    case "item/started": {
      const item = params.item ?? {};
      const type = item.type;

      if (type === "mcpToolCall") {
        const toolName = formatQualifiedMcpToolName(item);

        return [
          {
            action: "mcp.tool.started",
            kind: "tool_call",
            message:
              item.server && item.tool
                ? `Calling ${item.server}.${item.tool}`
                : "Calling a ReviewOps MCP tool.",
            tool_name: toolName,
            metadata: {
              server_name: item.server,
              tool_name: toolName,
              arguments: item.arguments ?? {},
            },
          },
        ];
      }

      if (type === "commandExecution") {
        return [
          {
            action: "codex.command.started",
            kind: "tool_call",
            message: `Running local command: ${item.command}`,
            tool_name: "bash",
            metadata: {
              command: item.command,
              cwd: item.cwd ?? null,
            },
          },
        ];
      }

      if (type === "webSearch") {
        return [
          {
            action: "codex.web-search.started",
            kind: "tool_call",
            message: `Running web search: ${item.query}`,
            tool_name: "web_search",
            metadata: {
              query: item.query,
            },
          },
        ];
      }

      return [];
    }
    case "item/completed": {
      const item = params.item ?? {};
      const type = item.type;

      if (type === "agentMessage") {
        return [
          {
            action: "codex.message",
            kind: "assistant_text",
            message: item.text ?? "Codex returned an assistant message.",
          },
        ];
      }

      if (type === "mcpToolCall") {
        const toolName = formatQualifiedMcpToolName(item);

        return [
          {
            action: "mcp.tool.completed",
            kind: "tool_result",
            message:
              previewValue(item.result?.structuredContent ?? item.result?.content) ||
              "Completed a ReviewOps MCP tool call.",
            tool_name: toolName,
            metadata: {
              server_name: item.server,
              tool_name: toolName,
              status: item.status ?? null,
            },
          },
        ];
      }

      if (type === "commandExecution") {
        return [
          {
            action: "codex.command.completed",
            kind: "tool_result",
            message:
              previewValue(item.aggregatedOutput) ||
              `Command exited with status ${item.status ?? "unknown"}.`,
            tool_name: "bash",
            metadata: {
              exit_code: item.exitCode ?? null,
              status: item.status ?? null,
            },
          },
        ];
      }

      return [];
    }
    case "error":
      return [
        {
          action: "codex.error",
          kind: "status",
          message: params.message ?? "Codex app-server reported an error.",
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
    .replaceAll("{prompt}", JSON.stringify(prompt))
    .replaceAll("{mcp_url}", mcpUrl);
}

async function executeCustomCommand(run) {
  await postRunEvent(run.id, {
    action: "helper.custom-command",
    kind: "status",
    message: "Launching the configured REVIEWOPS_RUN_COMMAND.",
  });

  const command = shellCommand(run.prompt, run.mcp_url);

  await new Promise((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        REVIEWOPS_PROMPT: run.prompt,
        REVIEWOPS_MCP_URL: run.mcp_url,
        REVIEWOPS_RUN_ID: String(run.id),
      },
    });

    child.stdout.on("data", async (chunk) => {
      const message = chunk.toString().trim();

      if (!message) {
        return;
      }

      try {
        await postRunEvent(run.id, {
          action: "codex.stdout",
          kind: "assistant_text",
          message,
        });
      } catch (error) {
        console.error(error);
      }
    });

    child.stderr.on("data", async (chunk) => {
      const message = chunk.toString().trim();

      if (!message) {
        return;
      }

      try {
        await postRunEvent(run.id, {
          action: "codex.stderr",
          kind: "status",
          message,
        });
      } catch (error) {
        console.error(error);
      }
    });

    child.on("error", reject);
    child.on("close", async (code) => {
      try {
        if (code === 0) {
          await completeRun(run.id, {
            summary: "Custom ReviewOps run command completed successfully.",
          });
          resolve();
          return;
        }

        await completeRun(run.id, {
          failed: true,
          error_message: `Custom ReviewOps run command exited with code ${code ?? 1}.`,
        });
        reject(new Error(`Command exited with code ${code ?? 1}`));
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function executeCodexRun(run) {
  const monitor = createRunMonitor();
  const client = new CodexAppServerClient({
    cwd: helperWorkspace,
    mcpUrl: run.mcp_url,
    model: codexModel,
    reasoningEffort: codexReasoningEffort,
  });

  const stopNotificationStream = client.onNotification((notification) => {
    if (notification.method === "turn/completed") {
      const status = notification.params?.turn?.status ?? "failed";

      if (status === "completed") {
        monitor.resolve(notification.params?.turn ?? {});
      } else {
        monitor.reject(
          new Error(
            notification.params?.turn?.error?.message ??
              `Codex turn finished with status ${status}.`,
          ),
        );
      }
    }

    for (const event of notificationToEvents(notification)) {
      void postRunEvent(run.id, event).catch((error) => {
        console.error(error);
      });
    }
  });

  const stopLifecycleStream = client.onLifecycle((event) => {
    const message =
      event.type === "stderr"
        ? event.message
        : event.type === "error"
          ? event.message
          : `Codex app-server exited with code ${event.code}.`;

    void postRunEvent(run.id, {
      action:
        event.type === "stderr"
          ? "codex.stderr"
          : event.type === "error"
            ? "codex.error"
            : "codex.closed",
      kind: "status",
      message,
    }).catch((error) => {
      console.error(error);
    });

    if (event.type === "error") {
      monitor.reject(new Error(event.message));
    }
  });

  try {
    await postRunEvent(run.id, {
      action: "helper.codex.starting",
      kind: "status",
      message: "Starting a local Codex app-server session for ReviewOps.",
    });

    await client.start();

    const statusResponse = await client.listMcpServerStatus();
    const reviewOpsServer = (statusResponse.data ?? []).find((server) => {
      const toolNames = Object.keys(server.tools ?? {});

      return (
        server.name === "reviewops" ||
        server.name === "ReviewOps Server" ||
        toolNames.some((toolName) =>
          toolName.includes("create_product_copy_change_proposal"),
        )
      );
    });

    if (!reviewOpsServer) {
      throw new Error(
        "Codex could not discover the reviewops MCP server. Check the MCP URL and device token.",
      );
    }

    await postRunEvent(run.id, formatMcpStatusEvent(reviewOpsServer));

    const threadResponse = await client.startThread({
      developerInstructions: buildDeveloperInstructions(),
      baseInstructions: null,
    });

    await postRunEvent(run.id, {
      action: "codex.thread.ready",
      kind: "status",
      message: "Codex thread is ready. Starting the ReviewOps turn now.",
      metadata: {
        thread_id: threadResponse.thread?.id ?? null,
      },
    });

    await client.startTurn({
      threadId: threadResponse.thread.id,
      prompt: buildAnalysisPrompt(run.prompt),
    });

    const turnResult = await monitor.completion;

    await completeRun(run.id, {
      summary:
        turnResult.summary ??
        "Local Codex run completed and streamed events back into ReviewOps.",
    });
  } finally {
    stopNotificationStream();
    stopLifecycleStream();
    client.stop();
  }
}

async function executeRun(run) {
  await postRunEvent(run.id, {
    action: "helper.started",
    kind: "status",
    message: "Local helper claimed the run and is preparing Codex.",
  });

  if (runCommand) {
    await executeCustomCommand(run);
    return;
  }

  await executeCodexRun(run);
}

async function tick() {
  const response = await request("/api/device/runs/claim", {
    method: "POST",
    body: JSON.stringify({}),
  });

  if (!response.run) {
    return false;
  }

  try {
    await executeRun(response.run);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown helper execution error.";

    await completeRun(response.run.id, {
      failed: true,
      error_message: message,
    });

    throw error;
  }

  return true;
}

console.log("ReviewOps helper started.");

async function main() {
  if (runOnce) {
    try {
      const handledRun = await tick();

      if (!handledRun && requireRun) {
        console.error("No queued ReviewOps run was available for the helper.");
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
      await tick();
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(loop, pollIntervalMs);
    }
  }

  await loop();
}

void main();
