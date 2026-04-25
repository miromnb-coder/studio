import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from './config/product';
import { AuthSync } from '@/components/auth/auth-sync';
import { GlobalMenuProvider } from './components/global-menu-provider';

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: PRODUCT_DESCRIPTION,
  applicationName: PRODUCT_NAME,
  appleWebApp: {
    capable: true,
    title: PRODUCT_NAME,
    statusBarStyle: 'default',
  },
  keywords: ['Kivo', 'AI', 'Assistant', 'Productivity', 'Agent'],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/favicon.svg'],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: PRODUCT_NAME,
    description: PRODUCT_DESCRIPTION,
    siteName: PRODUCT_NAME,
    type: 'website',
    images: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  twitter: {
    card: 'summary',
    title: PRODUCT_NAME,
    description: PRODUCT_DESCRIPTION,
    images: ['/icon.svg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#f7f7f5',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode;}>) {
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
