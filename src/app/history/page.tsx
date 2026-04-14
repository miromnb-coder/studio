'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../store/app-store';
import {
  AppShell,
  PremiumCard,
  ProductPageHeader,
  SectionHeader,
} from '../components/premium-ui';

function formatRelativeTime(iso: string) {
  const delta = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(delta / 60000));
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}

export default function HistoryPage() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const conversationList = useAppStore((s) => s.conversationList);
  const openConversation = useAppStore((s) => s.openConversation);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  const sorted = useMemo(
    () =>
      [...conversationList].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [conversationList],
  );

  return (
    <AppShell>
      <ProductPageHeader
        pageTitle="Conversations"
        pageSubtitle="Browse and reopen previous chat threads"
      />

      <PremiumCard className="space-y-2 p-4">
        <SectionHeader
          title="Conversation history"
          subtitle="Tap a thread to continue in chat"
        />

        {sorted.length === 0 ? (
          <p className="text-sm text-[#636a76]">No conversations yet.</p>
        ) : (
          sorted.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => {
                openConversation(conversation.id);
                router.push('/chat');
              }}
              className="tap-feedback flex w-full items-center justify-between rounded-[16px] border border-[#e7eaf0] bg-[#fcfcfd] p-3 text-left"
            >
              <span className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#111111]">
                  {conversation.title}
                </p>
                <p className="truncate text-xs text-[#636a76]">
                  {conversation.lastMessagePreview || 'No messages yet'}
                </p>
              </span>
              <span className="ml-3 text-xs text-[#8a93a0]">
                {formatRelativeTime(conversation.updatedAt)}
              </span>
            </button>
          ))
        )}
      </PremiumCard>
    </AppShell>
  );
}
