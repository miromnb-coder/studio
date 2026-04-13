'use client';

import { PageHeader } from './PageHeader';

type ChatHeaderProps = {
  onBack: () => void;
};

export function ChatHeader({ onBack }: ChatHeaderProps) {
  return <PageHeader title="Kivo" onBack={onBack} showBack />;
}
