import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Operator',
  description: 'Operator is your premium AI agent control center for chat, money intelligence, and memory.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
