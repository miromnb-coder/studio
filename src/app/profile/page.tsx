'use client';

import { Suspense, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toFriendlyAuthMessage } from '@/lib/auth/messages';
import { useAppStore } from '../store/app-store';
import { useUserEntitlements } from '../hooks/use-user-entitlements';
import { GmailIntegrationCard } from '../components/profile/GmailIntegrationCard';
import { AppShell, PremiumCard, SectionHeader, SmartButton } from '../components/premium-ui';

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const loadAuthStatus = useCallback(async () => {
    try {
      const authStatusResponse = await fetch(`/api/auth/status?_ts=${Date.now()}`, { cache: 'no-store' });
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
  }, []);

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

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', authUser.id).maybeSingle();

      const nextName = profile?.full_name || (authUser.user_metadata?.full_name as string | undefined) || authUser.email?.split('@')[0] || 'User';
      const nextEmail = authUser.email ?? '';

      setFullName(nextName);
      setEmail(nextEmail);
      setUser({ id: authUser.id, email: nextEmail, name: nextName });

      await loadAuthStatus();
    };

    void loadProfile();
  }, [supabase, setUser, clearUser, router, loadAuthStatus]);

  useEffect(() => {
    const gmail = searchParams.get('gmail');
    if (!gmail) return;

    if (gmail === 'connected') {
      setStatus('Gmail connected successfully.');
      setError(null);
      void loadAuthStatus();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gmail:callback-complete', { detail: { status: 'connected' } }));
      }
      return;
    }

    const reason = searchParams.get('reason');
    const step = searchParams.get('step');
    const failureDetails = reason === 'write_failed' && step ? ` (step: ${step})` : '';
    setStatus(null);
    setError(`Gmail connection failed. Please try again.${failureDetails}`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gmail:callback-complete', { detail: { status: 'error', reason, step } }));
    }
  }, [searchParams, loadAuthStatus]);

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

    const { error: metadataError } = await supabase.auth.updateUser({ data: { full_name: nextName } });

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

  const gmailCallbackState = searchParams.get('gmail');

  return (
    <AppShell>
      <PremiumCard className="space-y-4 p-5">
        <SectionHeader title="Profile" subtitle="Manage your identity, integrations, and operator preferences." />

        <PremiumCard className="bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Identity</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] text-base font-semibold text-zinc-200">
              {(fullName || user?.name || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-semibold text-zinc-100">{fullName || 'User'}</p>
              <p className="text-sm text-zinc-400">{email || 'No email'}</p>
            </div>
          </div>
        </PremiumCard>

        <form onSubmit={saveProfile} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Display name</span>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="system-input w-full bg-white px-3 py-2" placeholder="Your name" required />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Email</span>
            <input value={email} disabled className="system-input w-full bg-white px-3 py-2 opacity-70" />
          </label>

          {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}
          {status ? <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{status}</p> : null}

          <SmartButton type="submit" className="w-full" disabled={isSaving || !fullName.trim()}>{isSaving ? 'Saving…' : 'Save profile'}</SmartButton>
        </form>

        <PremiumCard className="p-4">
          <p className="text-sm font-semibold text-zinc-100">Connected tools</p>
          <p className="mt-1 text-sm text-zinc-400">Google sign-in: {signedInWithGoogle ? 'Connected' : 'Not connected'}</p>
          <p className="text-sm text-zinc-400">Gmail access: {gmailConnected ? 'Connected' : 'Not connected'}</p>
        </PremiumCard>

        <PremiumCard className="p-4">
          <p className="text-sm font-semibold text-zinc-100">Preferences</p>
          <p className="mt-1 text-sm text-zinc-400">Language: English</p>
          <p className="text-sm text-zinc-400">Theme: Premium Intelligence</p>
          <p className="text-sm text-zinc-400">Response style: Strategic + concise</p>
        </PremiumCard>

        <PremiumCard className="p-4">
          <p className="text-sm font-semibold text-zinc-100">Plan</p>
          <p className="mt-1 text-sm text-zinc-400">Current plan: {plan}</p>
          <p className="text-sm text-zinc-400">Usage today: {usage.unlimited ? 'Unlimited (Dev Mode)' : `${usage.current} / ${usage.limit}`}</p>
          <Link href="/upgrade" className="mt-3 inline-flex"><SmartButton variant="secondary" className="text-xs">Upgrade</SmartButton></Link>
        </PremiumCard>

        <GmailIntegrationCard gmailCallbackState={gmailCallbackState} />

        <SmartButton variant="secondary" className="w-full" type="button" onClick={logout} disabled={isSigningOut}>
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </SmartButton>
      </PremiumCard>
    </AppShell>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageContent />
    </Suspense>
  );
}
