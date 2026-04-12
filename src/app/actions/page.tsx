'use client';

import { useEffect, useMemo } from 'react';
import { ArrowRight, BarChart3, Mail, ScanSearch, Sparkles, Wallet, Workflow } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { AppShell, PremiumCard, ProductPageHeader, SectionHeader } from '../components/premium-ui';

const quickActions = [
  { title: 'Review subscriptions', desc: 'Find renewals, price increases, and cancel candidates.', icon: Wallet },
  { title: 'Analyze screenshot', desc: 'Extract decisions from receipts, bills, or account screens.', icon: ScanSearch },
  { title: 'Compare two options', desc: 'Evaluate tradeoffs and get a clear recommendation.', icon: BarChart3 },
  { title: 'Draft cancellation message', desc: 'Generate a concise and effective cancellation request.', icon: Mail },
];

const workflows = [
  'Save money plan for this month',
  'Plan my week with top priorities',
  'Summarize important emails into actions',
  'Create decision brief before large purchase',
];

export default function ActionsPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const history = useAppStore((s) => s.history);
  const enqueuePromptAndGoToChat = useAppStore((s) => s.enqueuePromptAndGoToChat);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  const recent = useMemo(() => history.slice(0, 4), [history]);

  return (
    <AppShell>
      <ProductPageHeader pageTitle="Actions" pageSubtitle="What Kivo can help you do next" />

      <div className="space-y-3">
        <PremiumCard className="p-4">
          <SectionHeader title="Recommended action" subtitle="Start here for immediate impact" />
          <button
            type="button"
            onClick={() => enqueuePromptAndGoToChat('Review my subscriptions and show me where I can save this month.')}
            className="w-full rounded-[18px] border border-[#d9dde4] bg-[#f8f9fb] p-4 text-left"
          >
            <p className="text-lg font-semibold text-[#22262c]">Review subscriptions</p>
            <p className="mt-1 text-sm text-[#6f7786]">Find ways to cut recurring costs across services and trials.</p>
            <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#4f5661]">Run now <ArrowRight className="h-3.5 w-3.5" /></p>
          </button>
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Quick operator actions" subtitle="High-frequency tasks you can tap immediately" />
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => enqueuePromptAndGoToChat(item.title)}
                className="flex w-full items-start gap-3 rounded-[16px] border border-[#d9dde4] bg-[#f8f9fb] p-3 text-left"
              >
                <span className="rounded-xl border border-[#d9dde4] bg-[#eef1f5] p-2 text-[#5b6270]"><Icon className="h-4 w-4" /></span>
                <span>
                  <p className="text-sm font-semibold text-[#2b3341]">{item.title}</p>
                  <p className="text-xs text-[#6f7786]">{item.desc}</p>
                </span>
              </button>
            );
          })}
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Suggested workflows" subtitle="Multi-step flows for planning and decisions" />
          {workflows.map((workflow) => (
            <button key={workflow} onClick={() => enqueuePromptAndGoToChat(workflow)} type="button" className="flex w-full items-center justify-between rounded-[16px] border border-[#d9dde4] bg-[#f8f9fb] px-3.5 py-3 text-sm text-[#2f3644]">
              <span className="inline-flex items-center gap-2"><Workflow className="h-4 w-4 text-[#6f7786]" /> {workflow}</span>
              <ArrowRight className="h-4 w-4 text-[#7a838f]" />
            </button>
          ))}
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Recently used actions" subtitle="Continue what you've already started" />
          {recent.length ? recent.map((item) => (
            <button key={item.id} onClick={() => enqueuePromptAndGoToChat(item.prompt ?? item.title)} type="button" className="block w-full rounded-[16px] border border-[#d9dde4] bg-[#f8f9fb] px-3.5 py-3 text-left">
              <p className="text-sm font-semibold text-[#2b3341]">{item.title}</p>
              <p className="text-xs text-[#6f7786]">{item.description}</p>
            </button>
          )) : <p className="inline-flex items-center gap-2 text-sm text-[#7a838f]"><Sparkles className="h-4 w-4" /> Your action history will appear here after you run a few tasks.</p>}
        </PremiumCard>
      </div>
    </AppShell>
  );
}
