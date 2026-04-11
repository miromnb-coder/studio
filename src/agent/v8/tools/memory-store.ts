import { createClient as createSupabaseClient } from '../../../lib/supabase/server';
import { UserMemoryItemV8, UserMemoryTypeV8 } from '../types';

const MEMORY_TABLE = 'memory';

function toType(raw: unknown): UserMemoryTypeV8 {
  if (raw === 'preference' || raw === 'fact' || raw === 'goal' || raw === 'finance') return raw;
  return 'other';
}

export async function fetchRelevantUserMemory(params: {
  userId: string;
  query: string;
  limit: number;
  financeOnly?: boolean;
}): Promise<UserMemoryItemV8[]> {
  const supabase = await createSupabaseClient();
  const queryTokens = params.query.toLowerCase().split(/\s+/).filter(Boolean);

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
      const relevanceScore = Number(((row.importance || 0.4) + tokenHits * 0.12).toFixed(3));

      return {
        id: row.id,
        userId: row.user_id,
        content,
        type: toType(row.type),
        importance: Number(row.importance || 0.4),
        relevanceScore,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      } as UserMemoryItemV8;
    })
    .filter((item: UserMemoryItemV8 | null): item is UserMemoryItemV8 => !!item)
    .sort((a: UserMemoryItemV8, b: UserMemoryItemV8) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, Math.min(8, Math.max(3, params.limit)));
}

export async function upsertUserMemory(params: {
  userId: string;
  content: string;
  type: UserMemoryTypeV8;
  importance: number;
}): Promise<{ ok: boolean; id?: string; reason?: string }> {
  const normalizedContent = params.content.trim();
  if (!normalizedContent) return { ok: false, reason: 'empty_content' };

  const supabase = await createSupabaseClient();
  const { data: existing } = await supabase
    .from(MEMORY_TABLE)
    .select('id,importance')
    .eq('user_id', params.userId)
    .eq('content', normalizedContent)
    .maybeSingle();

  if (existing?.id) {
    console.info('MEMORY_WRITE_START', {
      table: MEMORY_TABLE,
      mode: 'update',
      userId: params.userId,
      type: params.type,
      importance: params.importance,
    });

    const { error } = await supabase
      .from(MEMORY_TABLE)
      .update({ importance: Math.max(Number(existing.importance || 0), params.importance), updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    if (error) {
      console.error('MEMORY_WRITE_ERROR', { table: MEMORY_TABLE, mode: 'update', userId: params.userId, reason: error.message });
      return { ok: false, reason: error.message };
    }

    console.info('MEMORY_WRITE_SUCCESS', { table: MEMORY_TABLE, mode: 'update', userId: params.userId, id: existing.id });
    return { ok: true, id: existing.id };
  }

  const payload = {
    user_id: params.userId,
    content: normalizedContent,
    type: params.type,
    importance: Number(params.importance.toFixed(2)),
  };

  console.info('MEMORY_WRITE_START', {
    table: MEMORY_TABLE,
    mode: 'insert',
    userId: params.userId,
    type: params.type,
    importance: payload.importance,
  });

  const { data, error } = await supabase.from(MEMORY_TABLE).insert(payload).select('id').maybeSingle();
  if (error) {
    console.error('MEMORY_WRITE_ERROR', { table: MEMORY_TABLE, mode: 'insert', userId: params.userId, reason: error.message });
    return { ok: false, reason: error.message };
  }

  console.info('MEMORY_WRITE_SUCCESS', { table: MEMORY_TABLE, mode: 'insert', userId: params.userId, id: data?.id });

  return { ok: true, id: data?.id };
}
