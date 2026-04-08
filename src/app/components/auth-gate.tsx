'use client';

import { FormEvent, useState } from 'react';
import { Sparkles } from 'lucide-react';
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
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-5 py-10 text-slate-900">
      <div className="w-full max-w-md rounded-[24px] border border-black/[0.05] bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-500">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">Welcome to MiroAI</p>
            <p className="text-sm text-slate-500">Quick local onboarding to get started.</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Log in
          </button>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          {mode === 'signup' && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Alex"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </label>
          )}

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              required
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600"
          >
            {mode === 'signup' ? 'Create account' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
