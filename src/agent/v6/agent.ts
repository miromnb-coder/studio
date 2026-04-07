import { runAgentV6 } from './orchestrator';

/**
 * @fileOverview Engine V6.1 Standard Interface.
 * Cloned to src/agent/agent.ts to force global adoption.
 */

export async function runAgent(input: string, history: any[] = [], memory: any = null, imageUri?: string) {
  const userId = memory?.userId || 'system_anonymous';
  
  const safeHistory = (history || [])
    .filter(m => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map(m => ({
      role: m.role || 'user',
      content: m.content.trim()
    }));

  const { stream, metadata } = await runAgentV6(input, userId, safeHistory, imageUri);
  
  let content = "";
  try {
    for await (const chunk of stream) {
      content += chunk.choices[0]?.delta?.content || "";
    }
  } catch (e) {}

  return {
    content: content || "Analysis finalized.",
    data: {
      title: metadata.intent.toUpperCase() + " Audit",
      strategy: metadata.plan || "Proceed with caution.",
      steps: metadata.steps,
      structuredData: metadata.structuredData
    },
    intent: metadata.intent,
    mode: metadata.intent === 'finance' ? 'analyst' : 'general',
    isActionable: true
  };
}
