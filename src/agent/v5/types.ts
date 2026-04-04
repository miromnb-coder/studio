/**
 * @fileOverview Core types for Agent Engine v5.
 */

export type Intent = 'finance' | 'time_optimizer' | 'monetization' | 'technical' | 'analysis' | 'general' | 'meta_forge';

export interface AgentStep {
  thought: string;
  action: string;
  input: any;
  observation: any;
}

export interface ToolImpact {
  moneySaved?: number;
  timeSavedMinutes?: number;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: any;
  execute: (input: any, context: any) => Promise<any>;
  impact?: ToolImpact;
  isDynamic?: boolean;
}

export interface AgentMetadata {
  intent: Intent;
  plan: string;
  steps: AgentStep[];
  memoryUsed: boolean;
  language: string;
  iterationCount: number;
  toolUsed?: string;
  toolResultSummary?: string;
  forgedTool?: {
    name: string;
    description: string;
  };
  structuredData?: any; // NEW: Holds rich tool results for UI
}

export interface Decision {
  thought: string;
  action: string | 'final' | 'forge_tool';
  input?: any;
  final?: string;
}
