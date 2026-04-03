
import { runAgentV4Stream } from './v4/orchestrator';

/**
 * @fileOverview Agent v4.1 Entry Point.
 * 
 * PIPELINE:
 * 1. Orchestrator Initialization
 * 2. Multi-Agent Reasoning Loop
 * 3. Verified Output Delivery
 */

export interface AgentRunResult {
  content: string;
  intent: string;
  mode: string;
  isActionable: boolean;
  data: Record<string, any> | null;
}

export async function runAgent(input: string, history: any[] = [], memory: any = null, imageUri?: string): Promise<AgentRunResult> {
  console.log(`[AGENT_V4] Processing instruction: "${input.slice(0, 50)}..."`);
  const { stream, fastPathResponse, metadata } = await runAgentV4Stream(input, memory?.userId || 'anonymous', history, imageUri);
  const normalizedMetadata = (metadata || null) as Record<string, any> | null;

  if (fastPathResponse) {
    return {
      content: fastPathResponse,
      intent: normalizedMetadata?.intent || 'general',
      mode: normalizedMetadata?.intent || 'general',
      isActionable: false,
      data: normalizedMetadata
    };
  }

  let content = '';
  for await (const chunk of stream || []) {
    content += chunk?.choices?.[0]?.delta?.content || '';
  }

  return {
    content,
    intent: normalizedMetadata?.intent || 'general',
    mode: normalizedMetadata?.intent || 'general',
    isActionable: true,
    data: normalizedMetadata
  };
}
