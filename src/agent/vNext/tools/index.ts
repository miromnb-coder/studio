import { gmailTool } from './gmail-tool';
import { memoryTool } from './memory-tool';
import { calendarTool } from './calendar-tool';
import { webTool } from './web-tool';
import { compareTool } from './compare-tool';
import { fileTool } from './file-tool';
import { financeTool } from './finance-tool';
import { notesTool } from './notes-tool';
import { getContextMemory, getContextNotes, getConversationMessages } from './context';
import { toErrorMessage } from './helpers';
import { buildFailure } from './result-builders';
import type {
  AgentContext,
  AgentToolCall,
  AgentToolName,
  AgentToolResult,
  AgentToolRegistry,
} from './types';

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
  return tool in registry;
}

export async function executeTool(call: AgentToolCall, context: AgentContext): Promise<AgentToolResult> {
  const handler = registry[call.tool];
  if (!handler) return buildFailure(call, call.tool, `Tool not found: ${call.tool}`);

  try {
    return await handler(call, context);
  } catch (error) {
    return buildFailure(call, call.tool, toErrorMessage(error), { receivedInput: call.input });
  }
}

export async function executeTools(calls: AgentToolCall[], context: AgentContext): Promise<AgentToolResult[]> {
  const results: AgentToolResult[] = [];
  for (const call of calls) results.push(await executeTool(call, context));
  return results;
}

export function listSupportedTools(): AgentToolName[] {
  return Object.keys(registry) as AgentToolName[];
}

export function describeTool(tool: AgentToolName): {
  name: AgentToolName;
  summary: string;
  commonActions: string[];
} {
  switch (tool) {
    case 'gmail':
      return {
        name: 'gmail',
        summary: 'Email search, inbox summary, urgent triage, subscriptions, and digest workflows.',
        commonActions: ['status', 'search', 'scan_subscriptions', 'scan_receipts', 'summarize_inbox', 'digest', 'urgent', 'draft_reply'],
      };
    case 'memory':
      return { name: 'memory', summary: 'Retrieve, search, and later store memory context.', commonActions: ['status', 'search', 'retrieve', 'store'] };
    case 'calendar':
      return {
        name: 'calendar',
        summary: 'Availability, schedule reading, and planning-related actions.',
        commonActions: ['status', 'today_plan', 'find_focus_time', 'check_busy_week', 'weekly_reset', 'list_events', 'availability'],
      };
    case 'web':
      return { name: 'web', summary: 'Live web retrieval and source-based research.', commonActions: ['search', 'research', 'shopping', 'products', 'fetch', 'status'] };
    case 'compare':
      return { name: 'compare', summary: 'Deterministic structured comparisons between options.', commonActions: ['compare'] };
    case 'file':
      return { name: 'file', summary: 'Inspect and parse uploaded or referenced files.', commonActions: ['inspect', 'parse', 'summarize'] };
    case 'finance':
      return { name: 'finance', summary: 'Financial summaries, scans, and connector-driven analysis.', commonActions: ['overview', 'status', 'scan'] };
    case 'notes':
      return { name: 'notes', summary: 'List, search, and create note content.', commonActions: ['list', 'search', 'create'] };
    default:
      return { name: tool, summary: 'Unknown tool.', commonActions: [] };
  }
}

export function getToolDescriptions(): Array<ReturnType<typeof describeTool>> {
  return listSupportedTools().map(describeTool);
}

export function getToolNamesForIntent(intent: string): AgentToolName[] {
  switch (intent) {
    case 'gmail':
      return ['gmail', 'memory'];
    case 'finance':
      return ['finance', 'gmail', 'memory'];
    case 'productivity':
    case 'planning':
      return ['calendar', 'memory', 'notes'];
    case 'coding':
      return ['file', 'web', 'memory'];
    case 'shopping':
      return ['compare', 'web', 'finance', 'memory'];
    case 'research':
      return ['web', 'memory'];
    case 'memory':
      return ['memory', 'notes'];
    case 'compare':
      return ['compare', 'web', 'memory'];
    default:
      return ['memory'];
  }
}

export function getConversationContextSnapshot(context: AgentContext): {
  memoryCount: number;
  noteCount: number;
  messageCount: number;
} {
  return {
    memoryCount: getContextMemory(context).length,
    noteCount: getContextNotes(context).length,
    messageCount: getConversationMessages(context).length,
  };
}

export type {
  AgentToolHandler,
  AgentToolRegistry,
  ToolInput,
  ExecutionMetadata,
  CompareScorecard,
  PersistedFinanceProfile,
  WebAction,
  WebSearchItem,
  WebProductItem,
} from './types';
