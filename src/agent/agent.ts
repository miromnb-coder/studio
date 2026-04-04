import { runAgentV4 } from './v4/orchestrator';

/**
 * @fileOverview Standard Agent Compatibility Layer.
 * All routes and UI components now use this unified entry point to trigger the reasoning engine.
 */

export async function runAgent(input: string, history: any[] = [], memory: any = null, imageUri?: string) {
  const userId = memory?.userId || 'system_anonymous';
  
  console.log(`[AGENT_BRIDGE] Forwarding to Orchestrator v4.2...`);
  
  return runAgentV4(input, userId, history, imageUri);
}
