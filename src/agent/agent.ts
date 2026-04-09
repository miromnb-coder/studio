import { runAgentV7 } from './v7/orchestrator';

/**
 * @fileOverview Standard Agent Entry Point (Engine V7).
 * This file is the definitive bridge to the latest reasoning engine.
 */

export async function runAgent(input: string, history: any[] = [], memory: any = null, imageUri?: string) {
  const userId = memory?.userId || 'system_anonymous';

  console.log('[AGENT_SYSTEM] Routing to Engine V7...');

  const safeHistory = (history || [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role || 'user',
      content: m.content.trim(),
    }));

  const { stream, metadata, steps, structuredData } = await runAgentV7(
    input,
    userId,
    safeHistory,
    imageUri,
    memory,
  );

  let content = '';
  if (stream) {
    try {
      for await (const chunk of stream as any) {
        content += chunk.choices?.[0]?.delta?.content || '';
      }
    } catch (e) {
      console.error('[AGENT_SYSTEM] Stream accumulation failed:', e);
    }
  }

  return {
    content: content || 'Analysis finalized.',
    data: {
      title: metadata.intent.toUpperCase() + ' Audit',
      strategy: metadata.planSummary || 'Proceed with caution.',
      steps,
      structuredData,
    },
    intent: metadata.intent,
    mode: metadata.intent === 'finance' ? 'analyst' : 'general',
    isActionable: true,
  };
}
