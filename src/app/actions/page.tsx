'use client';

import { useEffect } from 'react';
import { BarChart3, ClipboardList, FileSearch, GitCompare, PenSquare, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { AppShell, PremiumCard, ProductPageHeader, SectionHeader } from '../components/premium-ui';
import { ActionTile } from '../components/product-sections';

export default function ActionsPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const enqueuePromptAndGoToChat = useAppStore((s) => s.enqueuePromptAndGoToChat);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return (
    <AppShell>
      <ProductPageHeader pageTitle="Actions" pageSubtitle="High-leverage AI tools ready in one tap" />
      <div className="space-y-3">
        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Quick AI tools" subtitle="Summarize, rewrite, analyze, compare, and plan" />
          <ActionTile title="Summarize" description="Turn long content into concise decisions and next steps." icon={FileSearch} onClick={() => enqueuePromptAndGoToChat('Summarize this and give me key actions.')} />
          <ActionTile title="Rewrite" description="Rewrite for clarity, confidence, or a specific tone." icon={PenSquare} onClick={() => enqueuePromptAndGoToChat('Rewrite this with a premium concise tone.')} />
          <ActionTile title="Analyze" description="Extract patterns, risks, and opportunities from data." icon={BarChart3} onClick={() => enqueuePromptAndGoToChat('Analyze this and tell me what matters most.')} />
          <ActionTile title="Compare" description="Compare options with a recommendation and tradeoffs." icon={GitCompare} onClick={() => enqueuePromptAndGoToChat('Compare these options and choose the best one.')} />
          <ActionTile title="Generate plan" description="Build an execution plan with milestones and owners." icon={ClipboardList} onClick={() => enqueuePromptAndGoToChat('Generate a practical plan with milestones.')} />
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Tool visuals" subtitle="Each tool has a dedicated identity" />
          <div className="grid grid-cols-2 gap-2">
            {['Finance Scanner', 'Memory Search', 'Research Mode', 'Automation Builder', 'Compare Tool', 'Planner'].map((tool) => (
              <div key={tool} className="rounded-[16px] border border-[#e7eaf0] bg-[#fcfcfd] p-3">
                <div className="mb-2 h-8 w-8 rounded-lg bg-gradient-to-br from-[#f2f4f8] to-[#e8ecf4]" />
                <p className="text-xs font-semibold text-[#111111]">{tool}</p>
              </div>
            ))}
          </div>
          <p className="inline-flex items-center gap-1 text-xs text-[#707784]"><Sparkles className="h-3.5 w-3.5" /> Tap any action to launch in chat instantly.</p>
        </PremiumCard>
      </div>
    </AppShell>
  );
}
