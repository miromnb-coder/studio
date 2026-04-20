import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import {
  nowIso,
  USER_INTELLIGENCE_VERSION,
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
    throw new Error('saveUserIntelligence requires a non-empty userId.');
  }
  return normalized;
}

function ensureProfile(profile: UserIntelligenceProfile): UserIntelligenceProfile {
  const userId = normalizeUserId(profile.userId);
  const updatedAt =
    typeof profile.updatedAt === 'string' && profile.updatedAt.trim().length > 0
      ? profile.updatedAt
      : nowIso();

  return {
    ...profile,
    userId,
    version:
      typeof profile.version === 'number' && profile.version > 0
        ? profile.version
        : USER_INTELLIGENCE_VERSION,
    updatedAt,
  };
}

export type SaveUserIntelligenceOptions = {
  touchUpdatedAt?: boolean;
};

export async function saveUserIntelligence(
  profile: UserIntelligenceProfile,
  options: SaveUserIntelligenceOptions = {},
): Promise<UserIntelligenceProfile> {
  const normalized = ensureProfile(profile);
  const finalProfile: UserIntelligenceProfile = options.touchUpdatedAt === false
    ? normalized
    : {
        ...normalized,
        updatedAt: nowIso(),
      };

  const row: PersistedUserIntelligenceRow = {
    user_id: finalProfile.userId,
    profile_json: finalProfile,
    version: finalProfile.version,
    updated_at: finalProfile.updatedAt,
  };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(row, {
      onConflict: 'user_id',
    });

  if (error) {
    throw new Error(`Failed to save user intelligence: ${error.message}`);
  }

  return finalProfile;
}
