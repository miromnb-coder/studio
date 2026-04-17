import type { Metadata } from 'next';
import './globals.css';
import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from './config/product';
import { AuthSync } from '@/components/auth/auth-sync';
import { GlobalMenuProvider } from './components/global-menu-provider';

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: PRODUCT_DESCRIPTION,
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="app-bg">
      <body className="mobile-app app-bg min-h-screen text-primary antialiased">
        <AuthSync />
        <GlobalMenuProvider>
          <div className="min-h-screen">{children}</div>
        </GlobalMenuProvider>
      </body>
    </html>
  );
}
