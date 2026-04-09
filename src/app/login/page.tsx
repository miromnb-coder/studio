'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PRODUCT_NAME } from '../config/product';
import { createClient } from '@/lib/supabase/client';
import { toFriendlyAuthMessage } from '@/lib/auth/messages';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      console.error('Login error', signInError);
      setError(toFriendlyAuthMessage(signInError, 'Unable to sign in right now.'));
      setIsLoading(false);
      return;
    }

    router.replace(searchParams.get('next') || '/chat');
    router.refresh();
  };

  return (
    <main className="screen app-bg">
      <section className="card-surface p-6">
        <h1 className="text-2xl font-semibold text-primary">Welcome back to {PRODUCT_NAME}</h1>
        <p className="mt-1 text-sm text-secondary">Sign in to continue your Kivo workspace.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-secondary">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="system-input w-full px-3 py-2" placeholder="you@example.com" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-secondary">Password</span>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="system-input w-full px-3 py-2" placeholder="••••••••" />
          </label>

          {error ? <p className="rounded-xl border border-[#dfc9c9] bg-[#f8eded] px-3 py-2 text-sm text-[#6e3030]">{error}</p> : null}

          <button disabled={isLoading} className="btn-primary tap-feedback w-full px-4 py-2 text-sm disabled:opacity-60" type="submit">
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-sm text-secondary">
          New to Kivo?{' '}
          <Link href="/signup" className="font-semibold text-primary">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
