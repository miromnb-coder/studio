/**
 * @fileOverview Core types for Agent v4.2 Multi-Agent Architecture.
 */

export type Intent = 'finance' | 'time_optimizer' | 'monetization' | 'technical' | 'analysis' | 'productivity' | 'general';

export type ToolAction =
  | 'analyze'
  | 'detect_leaks'
  | 'optimize_time'
  | 'generate_strategy'
  | 'technical_debug'
  | 'suggest_actions'
  | 'calendar'
  | 'todo'
  | 'notes'
  | 'web-search'
  | 'file-analyzer';

export type ToolErrorCode =
  | 'VALIDATION_ERROR'
  | 'TIMEOUT'
  | 'UNAVAILABLE'
  | 'NOT_FOUND'
  | 'PARSE_ERROR'
  | 'UNKNOWN_ERROR';

export interface ToolError {
  code: ToolErrorCode;
  message: string;
  retriable: boolean;
}

export interface ToolEnvelope<TData> {
  ok: boolean;
  data: TData | null;
  error: ToolError | null;
}

export interface CalendarToolInput {
  instruction: string;
  timezone?: string;
  dateContext?: string;
}

export interface CalendarToolOutput {
  summary: string;
  proposedEvents: Array<{
    title: string;
    start?: string;
    end?: string;
    notes?: string;
  }>;
}

export interface TodoToolInput {
  instruction: string;
}

export interface TodoToolOutput {
  summary: string;
  tasks: Array<{
    title: string;
    priority: 'high' | 'medium' | 'low';
    due?: string;
    done: boolean;
  }>;
}

export interface NotesToolInput {
  instruction: string;
}

export interface NotesToolOutput {
  summary: string;
  note: {
    title: string;
    bullets: string[];
  };
}

export interface WebSearchToolInput {
  query: string;
  maxResults?: number;
}

export interface WebSearchToolOutput {
  query: string;
  results: Array<{
    title: string;
    snippet: string;
  }>;
}

export interface FileAnalyzerToolInput {
  instruction: string;
  fileName?: string;
  fileContent?: string;
}

export interface FileAnalyzerToolOutput {
  summary: string;
  risks: string[];
  recommendations: string[];
}

export type ToolContractMap = {
  calendar: { input: CalendarToolInput; output: CalendarToolOutput };
  todo: { input: TodoToolInput; output: TodoToolOutput };
  notes: { input: NotesToolInput; output: NotesToolOutput };
  'web-search': { input: WebSearchToolInput; output: WebSearchToolOutput };
  'file-analyzer': { input: FileAnalyzerToolInput; output: FileAnalyzerToolOutput };
};

export interface AgentStep {
  action: ToolAction;
  priority: 'high' | 'medium' | 'low';
  description?: string;
}

export interface ToolResult {
  action: ToolAction;
  output: ToolEnvelope<unknown>;
  error?: string;
}

export interface CriticFeedback {
  score: number;
  issues: string[];
  needs_revision: boolean;
}

export interface AgentContext {
  input: string;
  history: any[];
  memory: any;
  imageUri?: string;
  language: string;
  intent: Intent;
  plan: AgentStep[];
  toolResults: ToolResult[];
  criticFeedback?: CriticFeedback;
  finalResponse?: any;
  fastPathUsed: boolean;
}
