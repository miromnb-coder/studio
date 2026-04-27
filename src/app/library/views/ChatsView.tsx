import { MessageCirclePlus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { LibraryData } from '../types';

export function ChatsView({ data }: { data: LibraryData }) {
  const router = useRouter();

  return (
    <div className="space-y-3.5 pb-28">
      <section className="rounded-[22px] border border-black/[0.055] bg-white p-4">
        <p className="text-[24px] font-semibold tracking-[-0.04em]">Conversations</p>
        <p className="mt-1 text-[13px] text-black/50">Your recent conversations with Kivo.</p>
      </section>

      <div className="flex gap-2.5">
        <button onClick={() => router.push('/chat')} className="flex flex-1 items-center justify-center gap-2 rounded-[14px] border border-black/[0.06] bg-white px-3 py-2.5 text-[13px] font-medium"><MessageCirclePlus className="h-4 w-4" />New chat</button>
        <button onClick={() => router.push('/search')} className="flex flex-1 items-center justify-center gap-2 rounded-[14px] border border-black/[0.06] bg-white px-3 py-2.5 text-[13px] font-medium"><Search className="h-4 w-4" />Search</button>
      </div>

      <section className="space-y-2.5 rounded-[22px] border border-black/[0.055] bg-white p-3.5">
        {data.conversations.length ? data.conversations.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            onClick={() => router.push('/chat')}
            className="w-full rounded-[14px] border border-black/[0.05] px-3 py-2.5 text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[14px] font-semibold">{conversation.title}</p>
                <p className="mt-1 line-clamp-2 text-[12px] text-black/50">{conversation.lastMessagePreview || 'Open to continue this conversation.'}</p>
              </div>
              <span className="shrink-0 text-[11px] text-black/40">{new Date(conversation.updatedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}</span>
            </div>
          </button>
        )) : <p className="px-1 py-3 text-[13px] text-black/45">No conversations yet. Start a new chat.</p>}
      </section>
    </div>
  );
}
