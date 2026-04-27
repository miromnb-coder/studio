'use client';

import { useEffect, useMemo, useState } from 'react';
import { LibraryFab } from './components/LibraryFab';
import { LibraryHeader } from './components/LibraryHeader';
import { LibraryTabs } from './components/LibraryTabs';
import { useAppStore } from '@/app/store/app-store';
import type { Tab } from './types';
import { getLibraryData } from './lib/getLibraryData';
import { TodayView } from './views/TodayView';
import { AgentsView } from './views/AgentsView';
import { WorkView } from './views/WorkView';
import { TimeView } from './views/TimeView';
import { ChatsView } from './views/ChatsView';
import { SavedView } from './views/SavedView';

type LibraryData = ReturnType<typeof getLibraryData>;

function renderTab(tab: Tab, data: LibraryData) {
  switch (tab) {
    case 'Today':
      return <TodayView data={data} />;
    case 'Agents':
      return <AgentsView data={data} />;
    case 'Work':
      return <WorkView data={data} />;
    case 'Time':
      return <TimeView data={data} />;
    case 'Chats':
      return <ChatsView data={data} />;
    case 'Saved':
      return <SavedView data={data} />;
    default:
      return <TodayView data={data} />;
  }
}

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Today');

  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const conversations = useAppStore((s) => s.conversationList);
  const messageState = useAppStore((s) => s.messageState);
  const agents = useAppStore((s) => s.agents);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const data = useMemo(
    () =>
      getLibraryData({
        user,
        conversations,
        messageState,
        agents,
      }),
    [user, conversations, messageState, agents],
  );

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#F6F6F5] text-[#202226]">
      <div className="fixed left-0 right-0 top-0 z-[9999] bg-[#F6F6F5]/96 backdrop-blur-2xl">
        <div
          className="mx-auto w-full max-w-[430px] px-[14px] pb-2"
          style={{ paddingTop: 'env(safe-area-inset-top, 12px)' }}
        >
          <LibraryHeader />
          <LibraryTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      <section className="absolute inset-x-0 bottom-0 top-[122px] overflow-y-auto [-webkit-overflow-scrolling:touch]">
        <div className="mx-auto w-full max-w-[430px] px-[14px] pb-[140px] pt-2">
          {renderTab(activeTab, data)}
        </div>
      </section>

      <LibraryFab />
    </main>
  );
}
