import type { SupabaseClient, User } from '@supabase/supabase-js';

export async function upsertUserProfile(
  supabase: SupabaseClient,
  user: User,
) {
  const payload = {
    id: user.id,
    updated_at: new Date().toISOString(),
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
    email: user.email ?? '',
    signedInWithGoogle:
      Array.isArray(user.app_metadata?.providers) &&
      user.app_metadata.providers.includes('google'),
  };
}
