import type { ReactNode } from 'react';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return <main className="relative min-h-screen bg-[#efeff2] text-[#4b5260]">{children}</main>;
}
