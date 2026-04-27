import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from './config/product';
import { AuthSync } from '@/components/auth/auth-sync';
import { GlobalMenuProvider } from './components/global-menu-provider';
import { KivoSplashScreen } from './components/kivo-splash-screen';

const KIVO_ICON = '/kivo-logo-v8.svg?v=8';

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: PRODUCT_DESCRIPTION,
  applicationName: PRODUCT_NAME,
  appleWebApp: { capable: true, title: PRODUCT_NAME, statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  keywords: ['Kivo', 'AI', 'Assistant', 'Productivity', 'Agent'],
  manifest: '/manifest.webmanifest?v=8',
  icons: {
    icon: [{ url: KIVO_ICON, type: 'image/svg+xml' }],
    shortcut: [KIVO_ICON],
    apple: [{ url: KIVO_ICON, sizes: '180x180', type: 'image/svg+xml' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#f7f7f5',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="app-bg">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kivo" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href={KIVO_ICON} />
        <link rel="icon" href={KIVO_ICON} type="image/svg+xml" />
      </head>
      <body className="mobile-app app-bg min-h-screen text-primary antialiased">
        <KivoSplashScreen />
        <AuthSync />
        <GlobalMenuProvider>
          <div className="min-h-screen kivo-page-reveal">{children}</div>
        </GlobalMenuProvider>
      </body>
    </html>
  );
}
