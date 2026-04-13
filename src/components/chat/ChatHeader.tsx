'use client';

import { PanelLeft } from 'lucide-react';
import { PageHeader } from './PageHeader';

type ChatHeaderProps = {
  onOpenConversations: () => void;
};

export function ChatHeader({ onOpenConversations }: ChatHeaderProps) {
  return (
    <PageHeader
      title="Kivo"
      showBack
      onLeftAction={onOpenConversations}
      leftButtonAriaLabel="Open conversations drawer"
      leftButtonIcon={<PanelLeft className="h-[18px] w-[18px]" strokeWidth={1.9} />}
    />
  );
}
