import type { AgentContext, AgentToolCall, AgentToolName, AgentToolResult } from './types';

export type AgentToolHandler = (call: AgentToolCall, context: AgentContext) => Promise<AgentToolResult>;
export type AgentToolRegistry = Record<AgentToolName, AgentToolHandler>;

function createPlaceholderTool(tool: AgentToolName, notes: string): AgentToolHandler {
  return async (call) => ({
    callId: call.callId,
    stepId: call.stepId,
    tool,
    ok: true,
    data: {
      placeholder: true,
      notes,
      receivedInput: call.input,
    },
    // TODO: Wire each tool to real provider adapters and permission checks.
  });
}

const gmailTool = createPlaceholderTool('gmail', 'TODO: Connect Gmail read/send workflows.');
const memoryTool = createPlaceholderTool('memory', 'TODO: Connect semantic + episodic memory stores.');
const calendarTool = createPlaceholderTool('calendar', 'TODO: Connect calendar providers and conflict checks.');
const webTool = createPlaceholderTool('web', 'TODO: Connect web retrieval and source quality filters.');
const compareTool = createPlaceholderTool('compare', 'TODO: Add deterministic comparison framework + scoring.');
const fileTool = createPlaceholderTool('file', 'TODO: Add secure file retrieval and parsing pipeline.');
const financeTool = createPlaceholderTool('finance', 'TODO: Connect finance connectors and normalized schemas.');
const notesTool = createPlaceholderTool('notes', 'TODO: Add notes capture and retrieval integration.');

const registry: AgentToolRegistry = {
  gmail: gmailTool,
  memory: memoryTool,
  calendar: calendarTool,
  web: webTool,
  compare: compareTool,
  file: fileTool,
  finance: financeTool,
  notes: notesTool,
};

export function getToolRegistry(): AgentToolRegistry {
  return registry;
}

export function hasTool(tool: AgentToolName): boolean {
  return Boolean(registry[tool]);
}

export async function executeTool(call: AgentToolCall, context: AgentContext): Promise<AgentToolResult> {
  const handler = registry[call.tool];

  if (!handler) {
    return {
      callId: call.callId,
      stepId: call.stepId,
      tool: call.tool,
      ok: false,
      data: {},
      error: `Tool not found: ${call.tool}`,
    };
  }

  return handler(call, context);
}
