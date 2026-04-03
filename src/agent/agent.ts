
import { runAgentV4 } from './v4/orchestrator';

/**
 * @fileOverview Agent v4.1 Entry Point.
 * 
 * PIPELINE:
 * 1. Orchestrator Initialization
 * 2. Multi-Agent Reasoning Loop
 * 3. Verified Output Delivery
 */

export async function runAgent(input: string, history: any[] = [], memory: any = null, imageUri?: string): Promise<any> {
  console.log(`[AGENT_V4] Processing instruction: "${input.slice(0, 50)}..."`);
  const userId = typeof memory === 'string' ? memory : memory?.userId || 'anonymous';
  const result = await runAgentV4(input, userId, history, imageUri);
  const metadata: any = result.metadata || {};

  // Preserve legacy top-level fields while keeping stable non-stream shape.
  return {
    ...result,
    intent: metadata.intent || 'general',
    mode: metadata.intent || 'general',
    isActionable: metadata.intent !== 'general',
    data: metadata
  };
}
