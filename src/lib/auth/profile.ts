import type { SupabaseClient, User } from '@supabase/supabase-js';

function inferName(user: User): string {
  const metadataName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
  if (metadataName) return metadataName;

  const emailName = user.email?.split('@')[0]?.trim();
  if (emailName) return emailName;

  return 'User';
}

export async function upsertUserProfile(supabase: SupabaseClient, user: User) {
  const fullName = inferName(user);
  const payload = {
    id: user.id,
    full_name: fullName,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });

  if (error) {
    console.error('PROFILE_UPSERT_ERROR', error);
  }

  return {
    fullName,
    email: user.email ?? '',
    signedInWithGoogle: Array.isArray(user.app_metadata?.providers) && user.app_metadata.providers.includes('google'),
  };
}
