import { runAgentVNext } from './vNext/orchestrator';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * @fileOverview Legacy Agent Entry Point.
 * Keeps backward compatibility while delegating runtime intelligence to vNext.
 */
export async function runAgent(input: string, history: any[] = [], memory: any = null, _imageUri?: string) {
  const supabase = await createSupabaseServerClient();
  const auth = await supabase.auth.getUser();
  const userId = auth.data.user?.id || memory?.userId || 'system_anonymous';

  const safeHistory = (history || [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m, index) => ({
      id: `history-${index}`,
      role: m.role || 'user',
      content: m.content.trim(),
    }));

  const execution = await runAgentVNext({
    requestId: crypto.randomUUID(),
    userId,
    message: input || 'Analysis Request',
    conversation: safeHistory,
    metadata: {
      memory: memory || null,
      productState: {
        plan: 'FREE',
        usage: { current: 0, limit: 10, remaining: 10 },
        gmailConnected: Boolean(memory?.gmailConnected),
      },
    },
  });

  const response = execution.response;

  return {
    content: response?.answer.text || 'Analysis finalized.',
    data: {
      title: String(response?.route.intent || 'general').toUpperCase() + ' Audit',
      strategy: response?.plan.summary || 'Proceed with caution.',
      steps: response?.plan.steps || [],
      structuredData: response?.answer.structuredData || {},
    },
    intent: response?.route.intent,
    mode: response?.route.intent === 'fallback' ? 'general' : 'analyst',
    isActionable: true,
  };
}
