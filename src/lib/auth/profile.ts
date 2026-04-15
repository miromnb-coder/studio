import type { SupabaseClient, User } from '@supabase/supabase-js';

function inferName(user: User): string {
  const fullName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name.trim()
      : '';

  if (fullName) return fullName;

  const displayName =
    typeof user.user_metadata?.display_name === 'string'
      ? user.user_metadata.display_name.trim()
      : '';

  if (displayName) return displayName;

  const emailName = user.email?.split('@')[0]?.trim();
  if (emailName) return emailName;

  return 'User';
}

export async function upsertUserProfile(
  supabase: SupabaseClient,
  user: User,
) {
  const displayName = inferName(user);
  const nowIso = new Date().toISOString();

  const payload = {
    id: user.id,
    email: user.email ?? null,
    display_name: displayName,
    updated_at: nowIso,
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    console.error('PROFILE_UPSERT_ERROR', {
      userId: user.id,
      error,
      payload,
    });
    throw error;
  }

  return {
    displayName,
    email: user.email ?? '',
    signedInWithGoogle:
      Array.isArray(user.app_metadata?.providers) &&
      user.app_metadata.providers.includes('google'),
  };
}
