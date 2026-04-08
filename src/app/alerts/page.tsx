import Link from 'next/link';

export default function AlertsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-slate-50 px-6 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Alerts</h1>
      <p className="mt-3 text-slate-500">No critical alerts right now. Check recent activity for latest changes.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
        Back Home
      </Link>
    </main>
  );
}
