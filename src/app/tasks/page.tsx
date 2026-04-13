'use client';

import { AlertTriangle, BellRing, CheckCircle2, Lightbulb, ListTodo } from 'lucide-react';
import { AppShell, PremiumCard, ProductPageHeader, SectionHeader } from '../components/premium-ui';
import { ActionTile } from '../components/product-sections';

export default function TasksPage() {
  return (
    <AppShell>
      <ProductPageHeader pageTitle="Tasks & Alerts" pageSubtitle="Operational intelligence for what needs action" />
      <div className="space-y-3">
        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Pending actions" subtitle="High-priority follow-ups" />
          <ActionTile title="Renewal risk" description="Adobe annual renewal is due in 3 days. Decide to keep or cancel." icon={AlertTriangle} onClick={() => window.location.assign('/chat')} />
          <ActionTile title="Opportunity" description="You can save $42/month by consolidating duplicate tools." icon={Lightbulb} onClick={() => window.location.assign('/chat')} />
          <ActionTile title="Reminder" description="Schedule quarterly budget review and send prep brief." icon={BellRing} onClick={() => window.location.assign('/chat')} />
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Suggested next steps" subtitle="Kivo recommendations based on your activity" />
          <div className="rounded-[16px] border border-[#e7eaf0] bg-[#fcfcfd] p-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#111111]"><ListTodo className="h-4 w-4" /> Consolidate subscriptions this week</p>
            <p className="mt-1 text-xs text-[#636a76]">Expected impact: reduce recurring spend and simplify monthly review.</p>
          </div>
          <div className="rounded-[16px] border border-[#e7eaf0] bg-[#fcfcfd] p-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#111111]"><CheckCircle2 className="h-4 w-4" /> Finish inbox triage automation</p>
            <p className="mt-1 text-xs text-[#636a76]">Expected impact: save 2.5 hours each week in repetitive sorting work.</p>
          </div>
        </PremiumCard>
      </div>
    </AppShell>
  );
}
