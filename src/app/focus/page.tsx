'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeDollarSign, CircleAlert, Clock3, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import { AppShell, PremiumCard, ProductPageHeader, SectionHeader, SmartButton } from '../components/premium-ui';

type AlertSeverity = 'low' | 'medium' | 'high';
type AlertStatus = 'active' | 'dismissed' | 'completed';

type OperatorAlert = {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  summary: string;
  suggested_action: string;
  metadata?: Record<string, unknown>;
  updated_at: string;
};

function metadataText(alert: OperatorAlert, key: string, fallback: string) {
  const value = alert.metadata?.[key];
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

export default function FocusPage() {
  const [alerts, setAlerts] = useState<OperatorAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/operator/alerts?include=all', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load');
      const payload = await response.json();
      const list = Array.isArray(payload.alerts) ? payload.alerts : [];
      setAlerts(list.filter((item: OperatorAlert) => item.status === 'active'));
    } catch (error) {
      console.error('FOCUS_LOAD_ERROR', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const topPriority = alerts[0];
  const risks = alerts.filter((item) => item.severity === 'high' || item.severity === 'medium').slice(0, 3);
  const opportunities = alerts.filter((item) => item.severity === 'low').slice(0, 3);

  const recentActivity = useMemo(
    () => [
      'Gmail sync paused 5h ago — finance scan is stale.',
      '2 subscriptions detected with upcoming renewal windows.',
      'Weekly spending pattern changed in groceries (+18%).',
    ],
    [],
  );

  return (
    <AppShell>
      <ProductPageHeader pageTitle="Focus" pageSubtitle="What needs attention right now" />

      <div className="space-y-3">
        <PremiumCard className="space-y-3 p-4">
          <SectionHeader title="Top priority" subtitle="Your highest-impact issue right now" />
          {loading ? (
            <p className="text-sm text-[#7a838f]">Loading priority signal…</p>
          ) : topPriority ? (
            <div className="rounded-[18px] border border-[#d9dde4] bg-[#f8f9fb] p-4">
              <p className="text-xl font-semibold text-[#22262c]">{topPriority.title}</p>
              <p className="mt-2 text-sm text-[#6f7786]">{topPriority.summary}</p>
              <p className="mt-2 text-xs text-[#59606d]"><span className="font-semibold">Why it matters:</span> {metadataText(topPriority, 'why_it_matters', topPriority.summary)}</p>
              <SmartButton className="mt-3 w-full justify-between" onClick={() => window.location.assign('/chat')}>
                {topPriority.suggested_action} <ArrowRight className="h-4 w-4" />
              </SmartButton>
            </div>
          ) : (
            <p className="text-sm text-[#7a838f]">No critical signals detected. Kivo is monitoring for renewals, billing shifts, and account risk.</p>
          )}
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Risks" subtitle="Issues that could cost money or create friction" />
          {risks.length === 0 ? (
            <p className="text-sm text-[#7a838f]">No active risks right now.</p>
          ) : (
            risks.map((risk) => (
              <div key={risk.id} className="rounded-[16px] border border-[#d9dde4] bg-[#f8f9fb] p-3">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#2b3341]"><ShieldAlert className="h-4 w-4" /> {risk.title}</p>
                <p className="mt-1 text-xs text-[#6f7786]">{risk.summary}</p>
              </div>
            ))
          )}
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Opportunities" subtitle="Ways to save or improve your setup" />
          {opportunities.length > 0 ? opportunities.map((item) => (
            <div key={item.id} className="rounded-[16px] border border-[#d9dde4] bg-[#f8f9fb] p-3">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#2b3341]"><TrendingUp className="h-4 w-4" /> {item.title}</p>
              <p className="mt-1 text-xs text-[#6f7786]">{metadataText(item, 'estimated_impact', item.summary)}</p>
            </div>
          )) : <p className="text-sm text-[#7a838f]">Kivo will surface savings opportunities after the next sync.</p>}
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Recent activity" subtitle="What changed in the last day" />
          {recentActivity.map((line) => (
            <p key={line} className="inline-flex items-center gap-2 text-sm text-[#5d6573]"><Clock3 className="h-4 w-4" /> {line}</p>
          ))}
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Recommended next action" subtitle="Do one thing now to reduce risk" />
          <button
            type="button"
            onClick={() => window.location.assign('/chat')}
            className="flex w-full items-center justify-between rounded-[16px] border border-[#d9dde4] bg-[#f8f9fb] px-3.5 py-3 text-left"
          >
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#2f3644]"><BadgeDollarSign className="h-4 w-4" /> Review subscriptions due in next 14 days</span>
            <CircleAlert className="h-4 w-4 text-[#7a838f]" />
          </button>
          <p className="inline-flex items-center gap-2 text-xs text-[#7a838f]"><Sparkles className="h-3.5 w-3.5" /> This typically prevents surprise charges before they post.</p>
        </PremiumCard>
      </div>
    </AppShell>
  );
}
