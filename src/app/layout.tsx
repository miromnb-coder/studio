import type { Metadata } from 'next';
import './globals.css';
import { BottomNav } from './components/bottom-nav';
import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from './config/product';

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
        <div className="min-h-screen">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
