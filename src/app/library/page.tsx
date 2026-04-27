'use client';
import { useState } from 'react';
import { LibraryFab } from './components/LibraryFab';
import { LibraryHeader } from './components/LibraryHeader';
import { LibraryTabs } from './components/LibraryTabs';
import { PlaceholderView } from './components/PlaceholderView';
import type { Tab } from './components/types';
export default function LibraryPage(){const [activeTab,setActiveTab]=useState<Tab>('Today');return <main className="fixed inset-0 overflow-hidden bg-[#F7F7F6] text-[#202226]"><div className="fixed left-0 right-0 top-0 z-[9999] bg-[#F7F7F6]/96 backdrop-blur-2xl"><div className="mx-auto w-full max-w-[430px] px-[18px] pb-2" style={{paddingTop:'env(safe-area-inset-top,16px)'}}><LibraryHeader/><LibraryTabs activeTab={activeTab} onChange={setActiveTab} /></div></div><section className="absolute inset-x-0 bottom-0 top-[136px] overflow-y-auto"><div className="mx-auto w-full max-w-[430px] px-[26px] pb-[230px]"><PlaceholderView title={activeTab} description="Own page area created. Next phase adds real content for each tab." /></div></section><LibraryFab/></main>}