
import { runAgentV4 } from './v4/orchestrator';

/**
 * @fileOverview Agent v4.1 Entry Point.
 * 
 * PIPELINE:
 * 1. Orchestrator Initialization
 * 2. Multi-Agent Reasoning Loop
 * 3. Verified Output Delivery
 */

export async function runAgent(input: string, history: any[] = [], memory: any = null, imageUri?: string) {
  console.log(`[AGENT_V4] Processing instruction: "${input.slice(0, 50)}..."`);
  return runAgentV4(input, history, memory, imageUri);
}
