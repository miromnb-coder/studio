'use client';

import { LayoutGrid } from 'lucide-react';
import { PageHeader } from './PageHeader';

type ChatHeaderProps = {
  onOpenConversations: () => void;
};

export function ChatHeader({ onOpenConversations }: ChatHeaderProps) {
  return (
    <PageHeader
      title="Kivo"
      mood="chat"
      showBack
      onLeftAction={onOpenConversations}
      leftButtonAriaLabel="Open conversations and memory drawer"
      leftButtonIcon={
        <LayoutGrid
          className="h-[18px] w-[18px]"
          strokeWidth={1.9}
        />
      }
    />
  );
}
