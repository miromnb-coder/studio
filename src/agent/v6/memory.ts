import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * @fileOverview Memory Engine v6: Supabase-backed compatibility layer.
 */

export interface AgentMemory {
  userId: string;
  goals: string[];
  preferences: string[];
  behaviorSummary: string;
  semanticMemory: string[];
  lastUpdated: string;
}

export interface EpisodicEvent {
  timestamp: string;
  input: string;
  action: string;
  observation: any;
  reflection?: string;
}

function defaultMemory(userId: string): AgentMemory {
  return {
    userId,
    goals: [],
    preferences: [],
    behaviorSummary: 'Passive intelligence gathering in progress.',
    semanticMemory: [],
    lastUpdated: new Date().toISOString(),
  };
}

export async function fetchMemory(userId: string): Promise<AgentMemory | null> {
  if (!userId || userId === 'system_anonymous') return null;

  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.from('finance_profiles').select('memory_summary').eq('user_id', userId).maybeSingle();

    if (result.error) {
      console.warn('[MEMORY_V6] Fetch main memory failed:', result.error);
      return null;
    }

    const memory = defaultMemory(userId);
    const summary = typeof result.data?.memory_summary === 'string' ? result.data.memory_summary.trim() : '';
    if (summary) {
      memory.behaviorSummary = summary;
      memory.semanticMemory = [summary];
    }

    return memory;
  } catch (e) {
    console.error('[MEMORY_V6] Fetch main memory failed:', e);
    return null;
  }
}

export async function updateMemory(userId: string, memoryUpdates: Partial<AgentMemory>) {
  if (!userId || userId === 'system_anonymous' || !memoryUpdates) return;

  try {
    const supabase = await createSupabaseServerClient();
    const currentMemory = (await fetchMemory(userId)) || defaultMemory(userId);

    const nextBehaviorSummary =
      memoryUpdates.behaviorSummary ||
      currentMemory.behaviorSummary ||
      [...(memoryUpdates.semanticMemory || []), ...(currentMemory.semanticMemory || [])].join(' · ').slice(0, 1500);

    const { error } = await supabase.from('finance_profiles').upsert(
      {
        user_id: userId,
        memory_summary: nextBehaviorSummary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      console.warn('[MEMORY_V6] Update main memory failed:', error);
    }
  } catch (e) {
    console.error('[MEMORY_V6] Update main memory failed:', e);
  }
}

export async function addEpisodicEvent(userId: string, event: Omit<EpisodicEvent, 'timestamp'>) {
  if (!userId || userId === 'system_anonymous') return;

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('finance_history').insert({
      user_id: userId,
      event_type: 'agent_v6_event',
      title: `Agent V6: ${event.action}`,
      summary: String(event.input || '').slice(0, 600),
      metadata: {
        action: event.action,
        input: event.input,
        observation: event.observation,
        reflection: event.reflection,
      },
    });

    if (error) {
      console.warn('[MEMORY_V6] Add episodic event failed:', error);
    }
  } catch (e) {
    console.error('[MEMORY_V6] Add episodic event failed:', e);
  }
}

export async function fetchRecentEpisodicEvents(userId: string, limitCount = 5): Promise<EpisodicEvent[]> {
  if (!userId || userId === 'system_anonymous') return [];

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('finance_history')
      .select('created_at,title,metadata')
      .eq('user_id', userId)
      .eq('event_type', 'agent_v6_event')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) {
      console.warn('[MEMORY_V6] Fetch episodic events failed:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      timestamp: String(row.created_at || ''),
      input: String(row?.metadata?.input || row.title || ''),
      action: String(row?.metadata?.action || 'unknown'),
      observation: row?.metadata?.observation || null,
      reflection: typeof row?.metadata?.reflection === 'string' ? row.metadata.reflection : undefined,
    }));
  } catch (e) {
    console.error('[MEMORY_V6] Fetch episodic events failed:', e);
    return [];
  }
}

export async function summarizeEpisodicMemory(_userId: string, events: EpisodicEvent[]): Promise<string> {
  return events
    .map((event) => `Input: ${event.input}, Action: ${event.action}, Observation: ${JSON.stringify(event.observation)}`)
    .join('\n');
}
