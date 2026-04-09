import { Suspense } from 'react';
import { LoginForm } from './login-form';

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
      <LoginForm />
    </Suspense>
  );
}
