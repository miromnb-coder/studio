'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toFriendlyAuthMessage } from '@/lib/auth/messages';
import {
  buildAuthCallbackUrl,
  sanitizeNextPath,
} from '@/lib/auth/redirects';
import { upsertUserProfile } from '@/lib/auth/profile';
import { saveReferralCode } from '@/lib/auth/referral';
import { PRODUCT_NAME } from '@/app/config/product';

type AuthMode = 'login' | 'signup';

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.35 12.23c0-.72-.06-1.43-.2-2.12H12v4.02h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.7 2.9-4.22 2.9-7.28Z"
        fill="#4285F4"
      />
      <path
        d="M12 21.7c2.62 0 4.82-.87 6.43-2.35l-3.14-2.44c-.87.58-1.99.93-3.29.93-2.53 0-4.67-1.71-5.44-4.01H3.3v2.51A9.7 9.7 0 0 0 12 21.7Z"
        fill="#34A853"
      />
      <path
        d="M6.56 13.83a5.79 5.79 0 0 1 0-3.66V7.66H3.3a9.7 9.7 0 0 0 0 8.68l3.26-2.51Z"
        fill="#FBBC04"
      />
      <path
        d="M12 6.16c1.42 0 2.69.49 3.7 1.45l2.76-2.76C16.81 3.3 14.61 2.3 12 2.3A9.7 9.7 0 0 0 3.3 7.66l3.26 2.51c.77-2.3 2.91-4.01 5.44-4.01Z"
        fill="#EA4335"
      />
    </svg>
  );
}

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
  const referralCode = searchParams.get('ref');

  useEffect(() => {
    if (!callbackError) return;
    setError('Google sign-in did not complete. Please try again.');
  }, [callbackError]);

  useEffect(() => {
    if (referralCode?.trim()) {
      saveReferralCode(referralCode);
    }
  }, [referralCode]);

  const continueWithGoogle = async () => {
    setError(null);
    setNotice(null);
    setIsGoogleLoading(true);

    const callbackQuery = new URLSearchParams();
    callbackQuery.set('next', nextPath);
    if (referralCode?.trim()) {
      callbackQuery.set('ref', referralCode);
    }

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: buildAuthCallbackUrl(`/auth/callback?${callbackQuery.toString()}`),
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
      console.error('UPSERT_PROFILE_ERROR', profileError);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();

    if (mode === 'signup') {
      const cleanName = fullName.trim() || cleanEmail.split('@')[0] || 'User';

      const callbackQuery = new URLSearchParams();
      callbackQuery.set('next', nextPath);
      if (referralCode?.trim()) {
        callbackQuery.set('ref', referralCode);
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: buildAuthCallbackUrl(`/auth/callback?${callbackQuery.toString()}`),
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
        setIsSubmitting(false);
        return;
      }

      if (data.user) {
        await safeUpsertProfile(data.user);
      }

      if (!data.session) {
        setNotice(
          'Account created. Please check your email and confirm your account before continuing.',
        );
        setIsSubmitting(false);
        return;
      }

      router.replace(nextPath);
      router.refresh();
      return;
    }

    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
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
      setIsSubmitting(false);
      return;
    }

    if (data.user) {
      await safeUpsertProfile(data.user);
    }

    router.replace(nextPath);
    router.refresh();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f5f7] px-4 py-8 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/80 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#e9ecf2] blur-3xl" />
      </div>

      <section className="relative mx-auto w-full max-w-md rounded-[28px] border border-white/70 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8">
        <div className="mb-7 space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7d8590]">
            {PRODUCT_NAME}
          </p>
          <h1 className="text-[30px] font-semibold leading-[1.15] text-[#171b24]">
            {mode === 'signup'
              ? `Create your ${PRODUCT_NAME} account`
              : `Welcome back to ${PRODUCT_NAME}`}
          </h1>
          <p className="text-sm leading-6 text-[#5f6772]">
            Continue with Google or sign in with email.
          </p>
        </div>

        <button
          type="button"
          onClick={continueWithGoogle}
          disabled={isGoogleLoading || isSubmitting}
          className="group inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-[#d8dde6] bg-white px-4 py-3.5 text-sm font-medium text-[#1d2430] shadow-[0_6px_22px_rgba(15,23,42,0.08)] transition hover:-translate-y-[1px] hover:border-[#c6cedb] hover:shadow-[0_10px_28px_rgba(15,23,42,0.11)] active:translate-y-0 active:shadow-[0_4px_14px_rgba(15,23,42,0.10)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleLogo />
          <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        <div className="my-7 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.12em] text-[#8b93a0]">
          <div className="h-px flex-1 bg-[#dde2eb]" />
          <span>Or continue with email</span>
          <div className="h-px flex-1 bg-[#dde2eb]" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === 'signup' ? (
            <label className="block space-y-2 text-sm">
              <span className="text-[13px] font-medium text-[#4a5361]">Name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-[#d8dde6] bg-white/95 px-4 py-3 text-[15px] text-[#111827] outline-none transition placeholder:text-[#9da4b1] focus:border-[#9ea7b7] focus:ring-4 focus:ring-[#dfe4ee]"
                placeholder="Alex Carter"
                required
              />
            </label>
          ) : null}

          <label className="block space-y-2 text-sm">
            <span className="text-[13px] font-medium text-[#4a5361]">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#d8dde6] bg-white/95 px-4 py-3 text-[15px] text-[#111827] outline-none transition placeholder:text-[#9da4b1] focus:border-[#9ea7b7] focus:ring-4 focus:ring-[#dfe4ee]"
              placeholder="you@example.com"
            />
          </label>

          <label className="block space-y-2 text-sm">
            <span className="text-[13px] font-medium text-[#4a5361]">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#d8dde6] bg-white/95 px-4 py-3 text-[15px] text-[#111827] outline-none transition placeholder:text-[#9da4b1] focus:border-[#9ea7b7] focus:ring-4 focus:ring-[#dfe4ee]"
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
            className="w-full rounded-2xl bg-[#171b24] px-4 py-3.5 text-sm font-medium text-white shadow-[0_14px_26px_rgba(16,20,30,0.25)] transition hover:bg-[#10141d] active:bg-[#0c1018] disabled:cursor-not-allowed disabled:bg-[#9aa2ae] disabled:shadow-none"
            type="submit"
          >
            {isSubmitting ? 'Please wait…' : 'Continue'}
          </button>
        </form>

        <p className="mt-6 text-sm text-[#616a77]">
          {mode === 'signup' ? 'Already have an account?' : 'New to Kivo?'}{' '}
          <Link
            href={mode === 'signup' ? '/login' : '/signup'}
            className="font-semibold text-[#171b24] underline decoration-[#bcc5d3] underline-offset-4 transition hover:decoration-[#171b24]"
          >
            {mode === 'signup' ? 'Sign in' : 'Create account'}
          </Link>
        </p>
      </section>
    </main>
  );
}
