'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import { useAuthSlice } from '@/app/lib/global-store';

type AuthMode = 'signup' | 'login';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { currentUser, signup, login } = useAuthSlice();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  if (currentUser) {
    return <>{children}</>;
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === 'signup') {
      signup(name, email);
      return;
    }

    login(email);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111315] px-5 py-10 text-[#f3f4f6]">
      <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#1d2127] p-6 shadow-[0_16px_36px_rgba(0,0,0,0.32)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-white/5 p-2.5 text-[#c9ced6]">
            <Image src="/icon.svg" alt="Kivo" width={20} height={20} className="h-5 w-5" priority />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">Welcome to Kivo</p>
            <p className="text-sm text-[#a1a1aa]">Quick local onboarding to get started.</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === 'signup' ? 'bg-[#1d2127] text-[#f3f4f6] shadow-sm' : 'text-[#a1a1aa]'
            }`}
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === 'login' ? 'bg-[#1d2127] text-[#f3f4f6] shadow-sm' : 'text-[#a1a1aa]'
            }`}
          >
            Log in
          </button>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          {mode === 'signup' && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-[#d4d6dc]">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Alex"
                className="w-full rounded-xl border border-white/10 bg-[#1d2127] px-3 py-2.5 text-[#f3f4f6] outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10"
                required
              />
            </label>
          )}

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#d4d6dc]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-white/10 bg-[#1d2127] px-3 py-2.5 text-[#f3f4f6] outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10"
              required
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#7d838d] px-4 py-2.5 text-sm font-semibold text-[#f3f4f6] transition hover:bg-[#6d737c]"
          >
            {mode === 'signup' ? 'Create account' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
