import Link from 'next/link';

export default function ChatPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-slate-50 px-6 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Chat</h1>
      <p className="mt-3 text-slate-500">Use the home prompt composer to start a new agent conversation.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
        Back Home
      </Link>
    </main>
  );
}
