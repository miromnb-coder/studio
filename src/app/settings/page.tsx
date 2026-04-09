'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '../store/app-store';

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const user = useAppStore((s) => s.user);
  const plan = useAppStore((s) => s.plan);
  const setPlan = useAppStore((s) => s.setPlan);

  const [status, setStatus] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const upgrade = async () => {
    if (!user) {
      setStatus('Please sign in first.');
      return;
    }

    setIsWorking(true);
    setStatus(null);

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setStatus('Your session expired. Please sign in again.');
      setIsWorking(false);
      return;
    }

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authUser.id, planId: 'PRO' }),
    });

    if (!response.ok) {
      setStatus('Could not start upgrade right now.');
      setIsWorking(false);
      return;
    }

    setPlan('PRO');
    setStatus('Upgrade successful. You now have Pro usage limits.');
    setIsWorking(false);
  };

  const downgrade = () => {
    setPlan('FREE');
    setStatus('Switched to free plan limits on this device.');
  };

  return (
    <main className="screen app-bg">
      <section className="card-surface p-5">
        <h1 className="text-2xl font-semibold text-primary">Settings</h1>
        <p className="mt-1 text-sm text-secondary">Manage account-level preferences for your Kivo workspace.</p>

        <div className="mt-4 rounded-xl border border-black/10 bg-[#f2f2f2] p-4 text-sm text-secondary">
          <p className="font-medium text-primary">Plan</p>
          <p className="mt-1">Current plan: <span className="font-semibold text-primary">{plan}</span></p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn-primary inline-flex items-center gap-1.5 px-3 py-2 text-sm" onClick={upgrade} disabled={isWorking || plan === 'PRO'}>
              <Crown className="h-4 w-4" /> {isWorking ? 'Upgrading…' : 'Upgrade to Pro'}
            </button>
            <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={downgrade} disabled={isWorking || plan === 'FREE'}>
              Switch to Free
            </button>
          </div>
          {status ? <p className="mt-2 text-xs text-secondary">{status}</p> : null}
        </div>

        <Link href="/profile" className="btn-secondary tap-feedback mt-4 inline-flex px-4 py-2 text-sm">
          Open profile
        </Link>
      </section>
    </main>
  );
}
