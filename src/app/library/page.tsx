'use client';
import { useState } from 'react';
import type { Tab } from './components/types';
import { PlaceholderView } from './components/PlaceholderView';
export default function LibraryPage(){const [activeTab,setActiveTab]=useState<Tab>('Today');return <main className="fixed inset-0 bg-[#F7F7F6]"><div className="p-6">Library split started: {activeTab}</div><div className="px-6"><PlaceholderView title="Library Refactor" description="Components folder added successfully. Continue splitting remaining UI parts next." /></div></main>}