import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { RootClientLayout } from '@/components/layout/RootClientLayout';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'OPERATOR // CRIMSON STEALTH',
  description: 'TACTICAL FINANCIAL INTELLIGENCE UNIT',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-mono antialiased bg-background text-foreground stealth-scrollbar">
        <FirebaseClientProvider>
          <AuthGuard>
            <RootClientLayout>
              {children}
            </RootClientLayout>
          </AuthGuard>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
