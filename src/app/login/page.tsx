'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PRODUCT_NAME } from '../config/product';
import { useAppStore } from '../store/app-store';

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    if (user) router.replace('/');
  }, [router, user]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0] || 'Operator';
    if (!cleanEmail) return;
    setUser({ id: cleanEmail, email: cleanEmail, name: cleanName });
    router.push('/');
  };

  return (
    <main className="screen app-bg">
      <section className="card-surface p-6">
        <h1 className="text-2xl font-semibold text-primary">Welcome to {PRODUCT_NAME}</h1>
        <p className="mt-1 text-sm text-secondary">Create your local account to run operators.</p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-secondary">Display name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="system-input w-full px-3 py-2" placeholder="Operator name" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-secondary">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="system-input w-full px-3 py-2" placeholder="you@example.com" />
          </label>
          <button className="btn-primary tap-feedback w-full px-4 py-2 text-sm" type="submit">Continue</button>
        </form>
      </section>
    </main>
  );
}
