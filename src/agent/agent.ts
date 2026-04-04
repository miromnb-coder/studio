
import { runAgentV4 } from './v4/orchestrator';
import { AgentV4Result } from './v4/types';

/**
 * @fileOverview Agent v4.1 Entry Point.
 * 
 * PIPELINE:
 * 1. Orchestrator Initialization
 * 2. Multi-Agent Reasoning Loop
 * 3. Verified Output Delivery
 */

export async function runAgent(
  input: string,
  userId: string,
  history: any[] = [],
  imageUri?: string
): Promise<AgentV4Result> {
  console.log(`[AGENT_V4] Processing instruction: "${input.slice(0, 50)}..."`);
  return runAgentV4(input, userId, history, imageUri);
}
