/**
 * @fileOverview Core types for Agent Engine v5.
 */

export type Intent = 'finance' | 'time_optimizer' | 'monetization' | 'technical' | 'analysis' | 'general';

export interface AgentStep {
  thought: string;
  action: string;
  input: any;
  observation: any;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
  execute: (input: any, context: any) => Promise<any>;
}

export interface AgentMetadata {
  intent: Intent;
  plan: string;
  steps: AgentStep[];
  memoryUsed: boolean;
  language: string;
  iterationCount: number;
}

export interface Decision {
  thought: string;
  action: string | 'final';
  input?: any;
  final?: string;
}
