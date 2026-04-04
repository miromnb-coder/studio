import { runAgentV4 } from './v4/orchestrator';

/**
 * @fileOverview Agent v4.2 Compatibility Layer.
 * 
 * This file provides a backward-compatible wrapper for the new multi-agent pipeline.
 */

export async function runAgent(input: string, history: any[] = [], memory: any = null, imageUri?: string) {
  // Extract userId from memory if possible, or use a fallback for non-authenticated contexts
  // In the current v4 architecture, userId is primarily used for memory fetching.
  const userId = memory?.userId || 'system_anonymous';
  
  console.log(`[AGENT_V4.2] Legacy Bridge - Processing: "${input.slice(0, 50)}..."`);
  
  return runAgentV4(input, userId, history, imageUri);
}
