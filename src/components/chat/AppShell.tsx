import type { ReactNode } from 'react';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return <main className="relative min-h-screen bg-[#f7f8fa] text-[#4b5563]">{children}</main>;
}
