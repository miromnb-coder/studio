import type { SupabaseClient } from '@supabase/supabase-js';
import {
  inferRelevantCategories,
  toPersonalMemoryType,
  type PersonalMemoryItem,
  type PersonalMemoryType,
} from '@/lib/memory/personal-memory';

const MEMORY_TABLE = 'memory';

function scoreTypeAffinity(type: PersonalMemoryType): number {
  switch (type) {
    case 'goals':
    case 'projects':
      return 0.12;
    case 'decisions':
    case 'unfinished_items':
      return 0.1;
    case 'preferences':
    case 'preference':
      return 0.08;
    case 'blockers':
    case 'opportunities':
      return 0.07;
    case 'finance':
      return 0.11;
    default:
      return 0.04;
  }
}

export async function fetchRelevantUserMemory(params: {
  supabase: SupabaseClient;
  userId: string;
  query: string;
  limit: number;
  financeOnly?: boolean;
  preferredTypes?: PersonalMemoryType[];
}): Promise<PersonalMemoryItem[]> {
  const { supabase } = params;
  const queryTokens = params.query.toLowerCase().split(/\s+/).filter(Boolean);
  const inferredTypes = inferRelevantCategories(params.query);
  const preferredTypes = new Set([
    ...(params.preferredTypes || []),
    ...inferredTypes,
  ]);

  let base = supabase
    .from(MEMORY_TABLE)
    .select('id,user_id,content,type,importance,created_at,updated_at')
    .eq('user_id', params.userId)
    .order('importance', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(50);

  if (params.financeOnly) {
    base = base.in('type', ['finance', 'goals', 'blockers', 'opportunities']);
  }

  const { data, error } = await base;
  if (error || !data) return [];

  return data
    .map((row: any) => {
      const content = typeof row.content === 'string' ? row.content.trim() : '';
      if (!content) return null;
      const lower = content.toLowerCase();
      const tokenHits = queryTokens.reduce(
        (hits, token) => (lower.includes(token) ? hits + 1 : hits),
        0,
      );
      const recencyBoost = row.updated_at
        ? Math.max(
            0,
            1 -
              (Date.now() - new Date(row.updated_at).getTime()) /
                (1000 * 60 * 60 * 24 * 60),
          ) * 0.1
        : 0;
      const type = toPersonalMemoryType(row.type);
      const typeBoost = preferredTypes.has(type)
        ? 0.16 + scoreTypeAffinity(type)
        : scoreTypeAffinity(type);
      const relevanceScore = Number(
        (
          (row.importance || 0.4) +
          tokenHits * 0.13 +
          recencyBoost +
          typeBoost
        ).toFixed(3),
      );

      return {
        id: row.id,
        userId: row.user_id,
        content,
        type,
        importance: Number(row.importance || 0.4),
        relevanceScore,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    })
    .filter((item: PersonalMemoryItem | null): item is PersonalMemoryItem => !!item)
    .sort(
      (a: PersonalMemoryItem, b: PersonalMemoryItem) =>
        (b.relevanceScore || 0) - (a.relevanceScore || 0),
    )
    .slice(0, Math.min(8, Math.max(3, params.limit)));
}
