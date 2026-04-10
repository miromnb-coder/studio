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
  const nowIso = new Date().toISOString();
  const payload = {
    id: user.id,
    full_name: fullName,
    updated_at: nowIso,
  };

  const { data: existingProfile, error: profileFetchError } = await supabase
    .from('profiles')
    .select('id,full_name,email')
    .eq('id', user.id)
    .maybeSingle();

  if (profileFetchError) {
    console.error('PROFILE_FETCH_ERROR', {
      userId: user.id,
      error: profileFetchError,
    });
  }

  const nextPayload = {
    ...payload,
    email: user.email ?? null,
  };

  console.log('Saving to Supabase:', {
    table: 'profiles',
    operation: existingProfile ? 'upsert_existing' : 'upsert_create',
    data: nextPayload,
  });

  const { error } = await supabase.from('profiles').upsert(nextPayload, { onConflict: 'id' });

  if (error) {
    console.error('PROFILE_UPSERT_ERROR', {
      userId: user.id,
      error,
    });
  }

  return {
    fullName,
    email: user.email ?? '',
    signedInWithGoogle: Array.isArray(user.app_metadata?.providers) && user.app_metadata.providers.includes('google'),
  };
}
