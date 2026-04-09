'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PRODUCT_NAME } from '../config/product';
import { createClient } from '@/lib/supabase/client';
import { toFriendlyAuthMessage } from '@/lib/auth/messages';

export default function SignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim() || cleanEmail.split('@')[0] || 'User';

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
        },
      },
    });

    if (signUpError) {
      console.error('Sign up error', signUpError);
      setError(toFriendlyAuthMessage(signUpError, 'Unable to create account right now.'));
      setIsLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          full_name: cleanName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );

      if (profileError) {
        console.error('Profile create error', profileError);
      }
    }

    if (!data.session) {
      setNotice('Please check your email to confirm your account, then sign in.');
      setIsLoading(false);
      return;
    }

    router.replace('/chat');
    router.refresh();
  };

  return (
    <main className="screen app-bg">
      <section className="card-surface p-6">
        <h1 className="text-2xl font-semibold text-primary">Create your {PRODUCT_NAME} account</h1>
        <p className="mt-1 text-sm text-secondary">Set up your profile to unlock chat, alerts, and history.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-secondary">Name</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="system-input w-full px-3 py-2" placeholder="Alex Carter" required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-secondary">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="system-input w-full px-3 py-2" placeholder="you@example.com" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-secondary">Password</span>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="system-input w-full px-3 py-2" placeholder="At least 6 characters" />
          </label>

          {error ? <p className="rounded-xl border border-[#dfc9c9] bg-[#f8eded] px-3 py-2 text-sm text-[#6e3030]">{error}</p> : null}
          {notice ? <p className="rounded-xl border border-[#d7dfc9] bg-[#f3f8ed] px-3 py-2 text-sm text-[#3f5c2a]">{notice}</p> : null}

          <button disabled={isLoading} className="btn-primary tap-feedback w-full px-4 py-2 text-sm disabled:opacity-60" type="submit">
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-sm text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
