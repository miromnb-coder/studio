'use client';

import Link from 'next/link';
import { useUserEntitlements } from '../hooks/use-user-entitlements';

export default function SettingsPage() {
  const { plan, usage } = useUserEntitlements();
  return (
    <main className="screen app-bg">
      <section className="card-surface p-5">
        <h1 className="text-2xl font-semibold text-primary">Settings</h1>
        <p className="mt-1 text-sm text-secondary">Manage account-level preferences for your Kivo workspace.</p>

        <div className="mt-4 rounded-xl border border-black/10 bg-[#f2f2f2] p-4 text-sm text-secondary">
          <p>Current plan: <span className="font-medium text-primary">{plan}</span></p>
          <p>Daily usage: {usage.current} / {usage.limit}</p>
        </div>

        <Link href="/upgrade" className="btn-primary tap-feedback mt-4 inline-flex px-4 py-2 text-sm">
          Upgrade
        </Link>

        <Link href="/profile" className="btn-secondary tap-feedback mt-3 inline-flex px-4 py-2 text-sm">
          Open profile
        </Link>
      </section>
    </main>
  );
}
