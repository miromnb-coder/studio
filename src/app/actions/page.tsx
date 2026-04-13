'use client';

import { useEffect } from 'react';
import { BarChart3, ClipboardList, FileSearch, GitCompare, PenSquare, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { AppShell, PremiumCard, ProductPageHeader, SectionHeader } from '../components/premium-ui';
import { ActionTile } from '../components/product-sections';

const toolPrompts = {
  summarize: 'Summarize this and give me key actions.',
  rewrite: 'Rewrite this with a premium concise tone.',
  analyze: 'Analyze this and tell me what matters most.',
  compare: 'Compare these options and choose the best one.',
  plan: 'Generate a practical plan with milestones.',
};

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
          <ActionTile title="Summarize" description="Turn long content into concise decisions and next steps." icon={FileSearch} onClick={() => enqueuePromptAndGoToChat(toolPrompts.summarize)} />
          <ActionTile title="Rewrite" description="Rewrite for clarity, confidence, or a specific tone." icon={PenSquare} onClick={() => enqueuePromptAndGoToChat(toolPrompts.rewrite)} />
          <ActionTile title="Analyze" description="Extract patterns, risks, and opportunities from data." icon={BarChart3} onClick={() => enqueuePromptAndGoToChat(toolPrompts.analyze)} />
          <ActionTile title="Compare" description="Compare options with a recommendation and tradeoffs." icon={GitCompare} onClick={() => enqueuePromptAndGoToChat(toolPrompts.compare)} />
          <ActionTile title="Generate plan" description="Build an execution plan with milestones and owners." icon={ClipboardList} onClick={() => enqueuePromptAndGoToChat(toolPrompts.plan)} />
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Tool visuals" subtitle="Tap cards to launch live tool prompts" />
          <div className="grid grid-cols-2 gap-2">
            {[
              { tool: 'Summarize', action: () => enqueuePromptAndGoToChat(toolPrompts.summarize) },
              { tool: 'Rewrite', action: () => enqueuePromptAndGoToChat(toolPrompts.rewrite) },
              { tool: 'Analyze', action: () => enqueuePromptAndGoToChat(toolPrompts.analyze) },
              { tool: 'Compare', action: () => enqueuePromptAndGoToChat(toolPrompts.compare) },
              { tool: 'Generate Plan', action: () => enqueuePromptAndGoToChat(toolPrompts.plan) },
              { tool: 'Gmail Inbox Analysis', action: () => enqueuePromptAndGoToChat('Analyze my inbox and show key follow-ups.') },
            ].map((tool) => (
              <button key={tool.tool} onClick={tool.action} type="button" className="tap-feedback rounded-[16px] border border-[#e7eaf0] bg-[#fcfcfd] p-3 text-left">
                <div className="mb-2 h-8 w-8 rounded-lg bg-gradient-to-br from-[#f2f4f8] to-[#e8ecf4]" />
                <p className="text-xs font-semibold text-[#111111]">{tool.tool}</p>
              </button>
            ))}
          </div>
          <p className="inline-flex items-center gap-1 text-xs text-[#707784]"><Sparkles className="h-3.5 w-3.5" /> Every card launches a functional tool flow in chat.</p>
        </PremiumCard>
      </div>
    </AppShell>
  );
}
