'use client';

import { useEffect } from 'react';
import { useAppStore } from '../store/app-store';

export default function ProfilePage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const history = useAppStore((s) => s.history);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return (
    <main className="screen app-bg">
      <section className="rounded-2xl bg-[#f7f7f7] p-5">
        <h1 className="text-2xl font-semibold text-primary">Profile</h1>
        <p className="text-sm text-secondary">Personal context that helps Kivo respond better over time.</p>

        <div className="mt-4 rounded-xl bg-[#f2f2f2] p-4 text-sm">
          <p className="text-secondary">Name</p>
          <p className="text-primary">{user?.name || 'Not set'}</p>
          <p className="mt-2 text-secondary">Email</p>
          <p className="text-primary">{user?.email || 'Not signed in'}</p>
        </div>

        <div className="mt-4 rounded-xl bg-[#f2f2f2] p-4 text-sm">
          <p className="font-semibold text-primary">Recent activity count</p>
          <p className="text-secondary">{history.length} events stored on this device</p>
        </div>
      </section>
    </main>
  );
}
