'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Chrome } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toFriendlyAuthMessage } from '@/lib/auth/messages';
import { buildAuthCallbackUrl, sanitizeNextPath } from '@/lib/auth/redirects';
import { upsertUserProfile } from '@/lib/auth/profile';
import { PRODUCT_NAME } from '@/app/config/product';

type AuthMode = 'login' | 'signup';

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const nextPath = sanitizeNextPath(searchParams.get('next'));
  const callbackError = searchParams.get('error');

  useEffect(() => {
    if (!callbackError) return;
    setError('Google sign-in did not complete. Please try again.');
  }, [callbackError]);

  const continueWithGoogle = async () => {
    setError(null);
    setNotice(null);
    setIsGoogleLoading(true);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: buildAuthCallbackUrl(
          `/auth/callback?next=${encodeURIComponent(nextPath)}`,
        ),
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (oauthError) {
      console.error('GOOGLE_AUTH_START_ERROR', oauthError);
      setError('Could not start Google sign-in. Please try again.');
      setIsGoogleLoading(false);
      return;
    }
  };

  const safeUpsertProfile = async (user: { id: string; email?: string | null }) => {
    try {
      await upsertUserProfile(supabase, user as any);
    } catch (profileError) {
      console.error('UPSERT_USER_PROFILE_ERROR', profileError);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (mode === 'signup') {
        const cleanName =
          fullName.trim() || cleanEmail.split('@')[0] || 'User';

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: buildAuthCallbackUrl(
              `/auth/callback?next=${encodeURIComponent(nextPath)}`,
            ),
            data: {
              full_name: cleanName,
              display_name: cleanName,
            },
          },
        });

        if (signUpError) {
          console.error('SIGN_UP_ERROR', signUpError);
          setError(
            toFriendlyAuthMessage(
              signUpError,
              'Unable to create account right now.',
            ),
          );
          return;
        }

        if (data.user) {
          await safeUpsertProfile(data.user);
        }

        if (!data.session) {
          setNotice(
            'Account created. Please check your email to confirm your account, then continue.',
          );
          return;
        }

        router.replace(nextPath);
        router.refresh();
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        console.error('SIGN_IN_ERROR', signInError);
        setError(
          toFriendlyAuthMessage(
            signInError,
            'Unable to sign in right now.',
          ),
        );
        return;
      }

      if (data.user) {
        await safeUpsertProfile(data.user);
      }

      router.replace(nextPath);
      router.refresh();
    } catch (unexpectedError) {
      console.error('AUTH_SUBMIT_UNEXPECTED_ERROR', unexpectedError);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="screen app-bg">
      <section className="card-surface p-6">
        <h1 className="text-2xl font-semibold text-primary">
          {mode === 'signup'
            ? `Create your ${PRODUCT_NAME} account`
            : `Welcome back to ${PRODUCT_NAME}`}
        </h1>

        <p className="mt-1 text-sm text-secondary">
          Secure sign in with Google, or continue with email.
        </p>

        <button
          type="button"
          onClick={continueWithGoogle}
          disabled={isGoogleLoading || isSubmitting}
          className="btn-primary mt-6 inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm disabled:opacity-60"
        >
          <Chrome className="h-4 w-4" />
          {isGoogleLoading ? 'Connecting to Google…' : 'Continue with Google'}
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-secondary">
          <div className="h-px flex-1 bg-black/10" />
          <span>Email (optional fallback)</span>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === 'signup' ? (
            <label className="block text-sm">
              <span className="mb-1 block text-secondary">Name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="system-input w-full px-3 py-2"
                placeholder="Alex Carter"
                required
              />
            </label>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1 block text-secondary">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="system-input w-full px-3 py-2"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-secondary">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="system-input w-full px-3 py-2"
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-[#dfc9c9] bg-[#f8eded] px-3 py-2 text-sm text-[#6e3030]">
              {error}
            </p>
          ) : null}

          {notice ? (
            <p className="rounded-xl border border-[#d7dfc9] bg-[#f3f8ed] px-3 py-2 text-sm text-[#3f5c2a]">
              {notice}
            </p>
          ) : null}

          <button
            disabled={isSubmitting || isGoogleLoading}
            className="btn-secondary tap-feedback w-full px-4 py-2 text-sm disabled:opacity-60"
            type="submit"
          >
            {isSubmitting ? 'Please wait…' : 'Continue'}
          </button>
        </form>

        <p className="mt-4 text-sm text-secondary">
          {mode === 'signup' ? 'Already have an account?' : 'New to Kivo?'}{' '}
          <Link
            href={mode === 'signup' ? '/login' : '/signup'}
            className="font-semibold text-primary"
          >
            {mode === 'signup' ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </section>
    </main>
  );
}
