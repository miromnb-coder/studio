import { Suspense } from 'react';
import LoginPageClient from './LoginPageClient';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="screen app-bg">
          <section className="card-surface p-6">
            <p className="text-sm text-secondary">Loading sign-in…</p>
          </section>
        </main>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
