import { runAgentV6 } from './v6/orchestrator';

/**
 * @fileOverview Standard Agent Compatibility Layer.
 * Updated to exclusively use Engine V6.1 (Streaming -> Static Bridge).
 * All routes and UI components now use this unified entry point to trigger the reasoning engine.
 */

export async function runAgent(input: string, history: any[] = [], memory: any = null, imageUri?: string) {
  const userId = memory?.userId || 'system_anonymous';
  
  console.log(`[AGENT_BRIDGE] Executing Engine V6.1 (Static Bridge)...`);
  
  // 🛡️ Mandatory sanitization for history
  const safeHistory = (history || [])
    .filter(m => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map(m => ({
      role: m.role || 'user',
      content: m.content.trim()
    }));

  const { stream, metadata } = await runAgentV6(input, userId, safeHistory, imageUri);
  
  // Accumulate stream for legacy non-streaming callers
  let content = "";
  try {
    for await (const chunk of stream) {
      content += chunk.choices[0]?.delta?.content || "";
    }
  } catch (e) {
    console.error("[AGENT_BRIDGE] Stream consumption failed:", e);
  }

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
