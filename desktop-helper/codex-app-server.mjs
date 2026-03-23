import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { createInterface } from 'node:readline';

function parseJsonLine(line) {
    try {
        return JSON.parse(line);
    } catch {
        return null;
    }
}

function isJsonRpcResponse(value) {
    return (
        Boolean(value) &&
        typeof value === 'object' &&
        'id' in value &&
        ('result' in value || 'error' in value) &&
        !('method' in value)
    );
}

export class CodexAppServerClient {
    constructor({
        cwd,
        mcpUrl,
        bearerTokenEnvVar = 'SIGNALS_DEVICE_TOKEN',
        model = 'gpt-5.4',
        reasoningEffort = 'medium',
    }) {
        this.cwd = cwd;
        this.mcpUrl = mcpUrl;
        this.bearerTokenEnvVar = bearerTokenEnvVar;
        this.model = model;
        this.reasoningEffort = reasoningEffort;
        this.process = null;
        this.stdin = null;
        this.pendingRequests = new Map();
        this.events = new EventEmitter();
    }

    onNotification(callback) {
        this.events.on('notification', callback);

        return () => {
            this.events.off('notification', callback);
        };
    }

    onLifecycle(callback) {
        this.events.on('lifecycle', callback);

        return () => {
            this.events.off('lifecycle', callback);
        };
    }

    emitNotification(notification) {
        this.events.emit('notification', notification);
    }

    emitLifecycle(event) {
        this.events.emit('lifecycle', event);
    }

    checkCli() {
        const result = spawnSync('codex', ['--version'], {
            timeout: 4000,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        if (result.error) {
            const message = result.error.message.toLowerCase();

            if (
                message.includes('enoent') ||
                message.includes('not found') ||
                message.includes('command not found')
            ) {
                throw new Error(
                    'Codex CLI is not installed. Install it with: npm install -g @openai/codex',
                );
            }

            throw new Error(`Codex CLI check failed: ${result.error.message}`);
        }
    }

    buildArgs() {
        return [
            'app-server',
            '--config',
            `mcp_servers.signals.url=${JSON.stringify(this.mcpUrl)}`,
            '--config',
            `mcp_servers.signals.bearer_token_env_var=${JSON.stringify(this.bearerTokenEnvVar)}`,
        ];
    }

    attachListeners(child) {
        const stdout = createInterface({ input: child.stdout });

        stdout.on('line', (line) => {
            const parsed = parseJsonLine(line);

            if (!parsed) {
                return;
            }

            if (isJsonRpcResponse(parsed)) {
                this.handleResponse(parsed);

                return;
            }

            if (typeof parsed.method === 'string') {
                this.emitNotification(parsed);
            }
        });

        const stderr = createInterface({ input: child.stderr });

        stderr.on('line', (line) => {
            if (!line.trim()) {
                return;
            }

            this.emitLifecycle({
                type: 'stderr',
                message: line.trim(),
            });
        });

        child.on('error', (error) => {
            this.emitLifecycle({
                type: 'error',
                message: error.message,
            });

            this.stop();
        });

        child.on('close', (code) => {
            this.emitLifecycle({
                type: 'close',
                code: code ?? 1,
            });

            this.stop();
        });
    }

    handleResponse(response) {
        const pending = this.pendingRequests.get(response.id);

        if (!pending) {
            return;
        }

        this.pendingRequests.delete(response.id);

        if (response.error) {
            pending.reject(
                new Error(
                    `${pending.method} failed: ${response.error.message ?? 'Unknown error'}`,
                ),
            );

            return;
        }

        pending.resolve(response.result ?? {});
    }

    async sendRequest(method, params = {}) {
        if (!this.stdin) {
            throw new Error('Codex app-server is not running.');
        }

        const id = randomUUID();
        const promise = new Promise((resolve, reject) => {
            this.pendingRequests.set(id, {
                method,
                resolve,
                reject,
            });
        });

        this.stdin.write(`${JSON.stringify({ id, method, params })}\n`);

        return promise;
    }

    writeMessage(message) {
        if (!this.stdin) {
            return;
        }

        this.stdin.write(`${JSON.stringify(message)}\n`);
    }

    async start() {
        this.checkCli();

        this.process = spawn('codex', this.buildArgs(), {
            cwd: this.cwd,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env },
        });
        this.stdin = this.process.stdin;

        this.attachListeners(this.process);

        await this.sendRequest('initialize', {
            clientInfo: {
                name: 'signals_helper',
                title: 'Signals Helper',
                version: '0.1.0',
            },
            capabilities: {
                experimentalApi: true,
            },
        });

        this.writeMessage({ method: 'initialized' });
    }

    async listMcpServerStatus() {
        return this.sendRequest('mcpServerStatus/list', {});
    }

    async startThread({ developerInstructions, baseInstructions }) {
        return this.sendRequest('thread/start', {
            cwd: this.cwd,
            model: this.model,
            approvalPolicy: 'never',
            sandbox: 'danger-full-access',
            developerInstructions,
            baseInstructions,
            config: {
                model_reasoning_effort: this.reasoningEffort,
                tools: {
                    web_search: false,
                },
            },
        });
    }

    async startTurn({ threadId, prompt }) {
        return this.sendRequest('turn/start', {
            threadId,
            approvalPolicy: 'never',
            model: this.model,
            input: [
                {
                    type: 'text',
                    text: prompt,
                    text_elements: [],
                },
            ],
        });
    }

    stop() {
        for (const pending of this.pendingRequests.values()) {
            pending.reject(new Error('Codex app-server stopped.'));
        }

        this.pendingRequests.clear();

        if (this.process) {
            try {
                this.process.kill('SIGKILL');
            } catch {
                // ignore
            }
        }

        this.process = null;
        this.stdin = null;
        this.events.removeAllListeners();
    }
}
