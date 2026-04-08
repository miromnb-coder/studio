import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Life Operator',
  description: 'Agent Engine v6 control surface for analysis, memory, and orchestration.',
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
