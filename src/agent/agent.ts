import { runAgentV8 } from './v8/orchestrator';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * @fileOverview Legacy Agent Entry Point.
 * Keeps backward compatibility while delegating runtime intelligence to v8.
 */
export async function runAgent(input: string, history: any[] = [], memory: any = null, _imageUri?: string) {
  const supabase = await createSupabaseServerClient();
  const auth = await supabase.auth.getUser();
  const userId = auth.data.user?.id || memory?.userId || 'system_anonymous';

  const safeHistory = (history || [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role || 'user',
      content: m.content.trim(),
    }));

  const result = await runAgentV8({
    supabase,
    input: input || 'Analysis Request',
    userId,
    history: safeHistory,
    memory: memory || null,
    productState: {
      plan: 'FREE',
      usage: { current: 0, limit: 10, remaining: 10 },
      gmailConnected: Boolean(memory?.gmailConnected),
    },
  });

  return {
    content: result.reply || 'Analysis finalized.',
    data: {
      title: String(result.metadata.intent || 'general').toUpperCase() + ' Audit',
      strategy: result.metadata.plan || 'Proceed with caution.',
      steps: result.metadata.steps || [],
      structuredData: result.metadata.structuredData || {},
    },
    intent: result.metadata.intent,
    mode: result.metadata.intent === 'finance' ? 'analyst' : 'general',
    isActionable: true,
  };
}
