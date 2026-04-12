import type { Metadata } from 'next';
import './globals.css';
import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from './config/product';
import { AuthSync } from '@/components/auth/auth-sync';
import { AppMenuSheet } from './components/app-menu-sheet';

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: PRODUCT_DESCRIPTION,
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
        <AppMenuSheet />
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
