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
    <html lang="en" className="bg-[#eef2f7]">
      <body className="mobile-app min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(241,245,249,0.92)_48%,_rgba(236,242,248,0.95)_100%)] text-slate-900 antialiased">
        <div className="min-h-screen">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
