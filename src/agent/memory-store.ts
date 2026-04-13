import type { SupabaseClient } from '@supabase/supabase-js';

const MEMORY_TABLE = 'memory';

type UserMemoryType = 'preference' | 'fact' | 'goal' | 'finance' | 'other';

type UserMemoryItem = {
  id: string;
  userId: string;
  content: string;
  type: UserMemoryType;
  importance: number;
  relevanceScore: number;
  createdAt: string;
  updatedAt?: string;
};

function toType(raw: unknown): UserMemoryType {
  if (raw === 'preference' || raw === 'fact' || raw === 'goal' || raw === 'finance') return raw;
  return 'other';
}

export async function fetchRelevantUserMemory(params: {
  supabase: SupabaseClient;
  userId: string;
  query: string;
  limit: number;
  financeOnly?: boolean;
  preferredTypes?: UserMemoryType[];
}): Promise<UserMemoryItem[]> {
  const { supabase } = params;
  const queryTokens = params.query.toLowerCase().split(/\s+/).filter(Boolean);
  const preferredTypes = new Set(params.preferredTypes || []);

  let base = supabase
    .from(MEMORY_TABLE)
    .select('id,user_id,content,type,importance,created_at,updated_at')
    .eq('user_id', params.userId)
    .order('importance', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(40);

  if (params.financeOnly) base = base.eq('type', 'finance');

  const { data, error } = await base;
  if (error || !data) return [];

  return data
    .map((row: any) => {
      const content = typeof row.content === 'string' ? row.content.trim() : '';
      if (!content) return null;
      const lower = content.toLowerCase();
      const tokenHits = queryTokens.reduce((hits, token) => (lower.includes(token) ? hits + 1 : hits), 0);
      const recencyBoost = row.updated_at ? Math.max(0, 1 - (Date.now() - new Date(row.updated_at).getTime()) / (1000 * 60 * 60 * 24 * 60)) * 0.08 : 0;
      const goalBoost = /goal|target|deadline|save|reduce|budget|plan/i.test(lower) ? 0.1 : 0;
      const preferenceBoost = /prefer|avoid|style|brief|concise|language/i.test(lower) ? 0.09 : 0;
      const constraintBoost = /constraint|rent|debt|income|cashflow|student|family|tight/i.test(lower) ? 0.08 : 0;
      const typeBoost = preferredTypes.has(toType(row.type)) ? 0.14 : 0;
      const relevanceScore = Number(((row.importance || 0.4) + tokenHits * 0.12 + recencyBoost + goalBoost + preferenceBoost + constraintBoost + typeBoost).toFixed(3));

      return {
        id: row.id,
        userId: row.user_id,
        content,
        type: toType(row.type),
        importance: Number(row.importance || 0.4),
        relevanceScore,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    })
    .filter((item: UserMemoryItem | null): item is UserMemoryItem => !!item)
    .sort((a: UserMemoryItem, b: UserMemoryItem) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, Math.min(8, Math.max(3, params.limit)));
}
