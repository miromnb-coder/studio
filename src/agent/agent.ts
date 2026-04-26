import { runKernel } from './kernel';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * @fileOverview Legacy Agent Entry Point.
 * Keeps older routes working while delegating runtime intelligence to Kernel.
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

  const response = await runKernel({
    userId,
    message: input || 'Analysis Request',
    mode: 'agent',
    metadata: {
      memory: memory || null,
      conversation: safeHistory,
      productState: {
        plan: 'FREE',
        usage: { current: 0, limit: 10, remaining: 10 },
        gmailConnected: Boolean(memory?.gmailConnected),
      },
    },
  });

  return {
    content: response.answer || 'Analysis finalized.',
    data: {
      title: String(response.mode || 'agent').toUpperCase() + ' Audit',
      strategy: response.summary || 'Kernel analysis completed.',
      steps: [],
      structuredData: response.metadata || {},
    },
    intent: response.mode,
    mode: response.mode === 'fast' ? 'general' : 'analyst',
    isActionable: true,
  };
}
