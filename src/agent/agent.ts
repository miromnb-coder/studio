import { runAgentV6 } from './v6/orchestrator';

/**
 * @fileOverview Standard Agent Entry Point (Engine V6.1).
 * This file is the definitive bridge to the latest reasoning engine.
 * All legacy and modern calls are routed through this unified interface.
 */

export async function runAgent(input: string, history: any[] = [], memory: any = null, imageUri?: string) {
  const userId = memory?.userId || 'system_anonymous';
  
  console.log(`[AGENT_SYSTEM] Routing to Engine V6.1...`);
  
  // 🛡️ Mandatory sanitization for history
  const safeHistory = (history || [])
    .filter(m => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map(m => ({
      role: m.role || 'user',
      content: m.content.trim()
    }));

  const { stream, metadata } = await runAgentV6(input, userId, safeHistory, imageUri);
  
  // Accumulate stream for legacy non-streaming callers (like results page)
  let content = "";
  try {
    for await (const chunk of stream) {
      content += chunk.choices[0]?.delta?.content || "";
    }
  } catch (e) {
    console.error("[AGENT_SYSTEM] Stream accumulation failed:", e);
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
