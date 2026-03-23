export interface ToolTraceActivity {
    id: string;
    name: string;
    callContent: string | null;
    resultContent: string | null;
    startedAt: string;
    completedAt: string | null;
    status: 'running' | 'complete' | 'error';
}

export interface ToolTickerItem {
    id: string;
    title: string;
    detail: string;
    status: ToolTraceActivity['status'];
}

export function formatToolName(toolName: string): string {
    return toolName
        .replace(/^mcp__signals__/, '')
        .replace(/(?:-tool|_tool)$/, '')
        .replaceAll('-', ' ')
        .replaceAll('_', ' ');
}

export function prettifyToolContent(content: string | null): string {
    if (content === null || content.trim() === '') {
        return 'Waiting for the tool result...';
    }

    return unwrapStructuredContent(content);
}

export function buildToolTickerItems(
    tools: ToolTraceActivity[],
): ToolTickerItem[] {
    return [...tools]
        .sort((left, right) => left.startedAt.localeCompare(right.startedAt))
        .slice(-8)
        .reverse()
        .map((tool) => ({
            id: tool.id,
            title: formatToolName(tool.name),
            detail: summarizeToolDetail(tool),
            status: tool.status,
        }));
}

function summarizeToolDetail(tool: ToolTraceActivity): string {
    if (tool.status === 'running') {
        return compactText(
            prettifyToolContent(tool.callContent) || 'Calling the next tool...',
        );
    }

    if (tool.status === 'error') {
        return compactText(
            prettifyToolContent(tool.resultContent) || 'Tool call failed.',
        );
    }

    return compactText(
        prettifyToolContent(tool.resultContent) || 'Tool call completed.',
    );
}

function compactText(text: string, maxLength = 140): string {
    const normalizedText = text.replace(/\s+/g, ' ').trim();

    if (normalizedText.length <= maxLength) {
        return normalizedText;
    }

    return `${normalizedText.slice(0, maxLength - 1)}…`;
}

function unwrapStructuredContent(content: string): string {
    const trimmedContent = content.trim();

    try {
        const parsedContent = JSON.parse(trimmedContent) as unknown;

        if (
            Array.isArray(parsedContent) &&
            parsedContent.length > 0 &&
            typeof parsedContent[0] === 'object' &&
            parsedContent[0] !== null &&
            'text' in parsedContent[0] &&
            typeof parsedContent[0].text === 'string'
        ) {
            return unwrapStructuredContent(parsedContent[0].text);
        }

        if (typeof parsedContent === 'string') {
            return unwrapStructuredContent(parsedContent);
        }

        return JSON.stringify(parsedContent, null, 2);
    } catch {
        return content;
    }
}
