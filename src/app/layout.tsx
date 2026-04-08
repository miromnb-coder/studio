import type { Metadata } from 'next';
import './globals.css';
import { AuthGate } from '@/app/components/auth-gate';

export const metadata: Metadata = {
  title: 'MiroAI',
  description: 'Premium mobile AI operator dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#eef2f7]">
      <body className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(241,245,249,0.92)_48%,_rgba(236,242,248,0.95)_100%)] text-slate-900 antialiased">
        <AuthGate>
          <div className="min-h-screen">{children}</div>
        </AuthGate>
      </body>
    </html>
  );
}
