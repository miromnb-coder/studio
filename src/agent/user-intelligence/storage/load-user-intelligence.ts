import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import {
  createEmptyUserIntelligenceProfile,
  normalizeUserIntelligenceProfile,
  type PersistedUserIntelligenceRow,
  type UserIntelligenceProfile,
} from '../types';

const TABLE_NAME = 'user_intelligence';

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function normalizeUserId(userId: string): string {
  const normalized = userId.trim();
  if (!normalized) {
    throw new Error('loadUserIntelligence requires a non-empty userId.');
  }
  return normalized;
}

export type LoadUserIntelligenceOptions = {
  createIfMissing?: boolean;
};

export async function loadUserIntelligence(
  userId: string,
  options: LoadUserIntelligenceOptions = {},
): Promise<UserIntelligenceProfile | null> {
  const normalizedUserId = normalizeUserId(userId);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('user_id, profile_json, version, updated_at')
    .eq('user_id', normalizedUserId)
    .maybeSingle<PersistedUserIntelligenceRow>();

  if (error) {
    throw new Error(`Failed to load user intelligence: ${error.message}`);
  }

  if (!data) {
    return options.createIfMissing
      ? createEmptyUserIntelligenceProfile(normalizedUserId)
      : null;
  }

  const normalized = normalizeUserIntelligenceProfile(
    data.profile_json,
    normalizedUserId,
  );

  return {
    ...normalized,
    version:
      typeof data.version === 'number' ? data.version : normalized.version,
    updatedAt:
      typeof data.updated_at === 'string' && data.updated_at.trim().length > 0
        ? data.updated_at
        : normalized.updatedAt,
  };
}
