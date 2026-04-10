'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toFriendlyAuthMessage } from '@/lib/auth/messages';
import { useAppStore } from '../store/app-store';
import { useUserEntitlements } from '../hooks/use-user-entitlements';
import { GmailIntegrationCard } from '../components/profile/GmailIntegrationCard';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const clearUser = useAppStore((s) => s.clearUser);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signedInWithGoogle, setSignedInWithGoogle] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const { plan, usage } = useUserEntitlements();

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        clearUser();
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', authUser.id)
        .maybeSingle();

      const nextName = profile?.full_name || (authUser.user_metadata?.full_name as string | undefined) || authUser.email?.split('@')[0] || 'User';
      const nextEmail = authUser.email ?? '';

      setFullName(nextName);
      setEmail(nextEmail);
      setUser({ id: authUser.id, email: nextEmail, name: nextName });

      try {
        const authStatusResponse = await fetch('/api/auth/status', { cache: 'no-store' });
        if (authStatusResponse.ok) {
          const payload = (await authStatusResponse.json()) as {
            signed_in_with_google?: boolean;
            gmail_connected?: boolean;
          };
          setSignedInWithGoogle(Boolean(payload.signed_in_with_google));
          setGmailConnected(Boolean(payload.gmail_connected));
        }
      } catch (statusError) {
        console.error('AUTH_STATUS_LOAD_ERROR', statusError);
      }
    };

    void loadProfile();
  }, [supabase, setUser, clearUser, router]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setIsSaving(true);

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setError('Your session expired. Please sign in again.');
      setIsSaving(false);
      router.replace('/login');
      return;
    }

    const nextName = fullName.trim();

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: authUser.id,
        full_name: nextName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

    if (profileError) {
      console.error('Profile update error', profileError);
      setError('Could not update your profile. Please try again.');
      setIsSaving(false);
      return;
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { full_name: nextName },
    });

    if (metadataError) {
      console.error('Metadata update error', metadataError);
    }

    setUser({ id: authUser.id, email: authUser.email ?? '', name: nextName });
    setStatus('Profile updated.');
    setIsSaving(false);
  };

  const logout = async () => {
    setError(null);
    setStatus(null);
    setIsSigningOut(true);

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error('Sign out error', signOutError);
      setError(toFriendlyAuthMessage(signOutError, 'Could not sign out right now.'));
      setIsSigningOut(false);
      return;
    }

    clearUser();
    router.replace('/login');
    router.refresh();
  };

  return (
    <main className="screen app-bg">
      <section className="card-surface p-5">
        <h1 className="text-2xl font-semibold text-primary">Profile</h1>
        <p className="text-sm text-secondary">Manage your Kivo account details.</p>

        <div className="mt-4 rounded-xl border border-black/10 bg-[#f2f2f2] p-4 text-sm">
          <p className="text-secondary">Avatar</p>
          <div className="mt-2 inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-[#ececec] text-base font-semibold text-primary">
            {(fullName || user?.name || 'U').slice(0, 1).toUpperCase()}
          </div>
        </div>

        <form onSubmit={saveProfile} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-secondary">Display name</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="system-input w-full px-3 py-2"
              placeholder="Your name"
              required
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-secondary">Email</span>
            <input value={email} disabled className="system-input w-full px-3 py-2 opacity-70" />
          </label>

          {error ? <p className="rounded-xl border border-[#dfc9c9] bg-[#f8eded] px-3 py-2 text-sm text-[#6e3030]">{error}</p> : null}
          {status ? <p className="rounded-xl border border-[#d7dfc9] bg-[#f3f8ed] px-3 py-2 text-sm text-[#3f5c2a]">{status}</p> : null}

          <button type="submit" className="btn-primary tap-feedback w-full px-4 py-2 text-sm disabled:opacity-60" disabled={isSaving || !fullName.trim()}>
            {isSaving ? 'Saving…' : 'Save profile'}
          </button>
        </form>

        <div className="mt-4 rounded-xl border border-black/10 bg-[#f2f2f2] p-4 text-sm">
          <p className="font-medium text-primary">Connection status</p>
          <p className="mt-1 text-secondary">Google sign-in: {signedInWithGoogle ? 'Connected' : 'Not connected'}</p>
          <p className="text-secondary">Gmail access: {gmailConnected ? 'Connected' : 'Not connected'}</p>
        </div>

        <div className="mt-4 rounded-xl border border-black/10 bg-[#f2f2f2] p-4 text-sm">
          <p className="font-medium text-primary">Subscription</p>
          <p className="mt-1 text-secondary">Current plan: {plan}</p>
          <p className="text-secondary">Usage today: {usage.unlimited ? 'Unlimited (Dev Mode)' : `${usage.current} / ${usage.limit}`}</p>
          <Link href="/upgrade" className="btn-secondary tap-feedback mt-3 inline-flex px-3 py-1.5 text-xs">
            Upgrade
          </Link>
        </div>

        <GmailIntegrationCard />

        <button type="button" className="btn-secondary tap-feedback mt-3 w-full px-4 py-2 text-sm" onClick={logout} disabled={isSigningOut}>
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
      </section>
    </main>
  );
}
