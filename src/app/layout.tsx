import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logic Engine - Clean Slate',
  description: 'Backend & Logic Layer Only',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
