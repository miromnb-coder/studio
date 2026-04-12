'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, CircleDashed, RefreshCw, TriangleAlert, XCircle } from 'lucide-react';
import { ActionRow, AppShell, EmptyState, PremiumCard, SectionHeader, SmartButton } from '../components/premium-ui';

type AlertSeverity = 'low' | 'medium' | 'high';
type AlertStatus = 'active' | 'dismissed' | 'completed';

type OperatorAlert = {
  id: string;
  type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  summary: string;
  suggested_action: string;
  metadata?: Record<string, unknown>;
  updated_at: string;
};

const severityWeight: Record<AlertSeverity, number> = { high: 3, medium: 2, low: 1 };
const severityStyle: Record<AlertSeverity, string> = {
  high: 'bg-red-500/10 text-red-300 border-red-500/30',
  medium: 'bg-amber-500/15 text-amber-200 border-amber-400/35',
  low: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
};

function currency(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function parseSavings(alert: OperatorAlert): number {
  const metadata = alert.metadata || {};
  const direct = Number(metadata.potential_monthly_savings || metadata.monthly_total || metadata.monthly_amount || 0);
  return Number.isFinite(direct) ? Math.max(0, direct) : 0;
}

function metadataText(alert: OperatorAlert, key: string, fallback: string) {
  const value = alert.metadata?.[key];
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<OperatorAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAlertId, setBusyAlertId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/operator/alerts', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load alerts');
      const payload = await response.json();
      const data = Array.isArray(payload.alerts) ? payload.alerts : [];
      setAlerts(
        data.sort(
          (a: OperatorAlert, b: OperatorAlert) =>
            severityWeight[b.severity] - severityWeight[a.severity] ||
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        ),
      );

      const stale = data.every((item: OperatorAlert) => Date.now() - new Date(item.updated_at).getTime() > 1000 * 60 * 60 * 6);
      if (!data.length || stale) {
        await evaluateAlerts();
      }
    } catch (error) {
      console.error('ALERTS_PAGE_LOAD_ERROR', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const evaluateAlerts = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/operator/alerts/evaluate', { method: 'POST' });
      if (!response.ok) return;
      const payload = await response.json();
      const data = Array.isArray(payload.alerts) ? payload.alerts : [];
      setAlerts(
        data
          .filter((item: OperatorAlert) => item.status === 'active')
          .sort(
            (a: OperatorAlert, b: OperatorAlert) =>
              severityWeight[b.severity] - severityWeight[a.severity] ||
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
          ),
      );
    } catch (error) {
      console.error('ALERTS_PAGE_EVALUATE_ERROR', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const activeAlerts = useMemo(() => alerts.filter((item) => item.status === 'active'), [alerts]);

  const summary = useMemo(() => {
    const top = activeAlerts[0] || null;
    const potentialSavings = Math.round(activeAlerts.reduce((sum, item) => sum + parseSavings(item), 0));

    return {
      top,
      potentialSavings,
      recommendedNextAction: top?.suggested_action || 'No urgent action needed right now.',
      topPriorities: activeAlerts.slice(0, 3),
    };
  }, [activeAlerts]);

  const handleStatus = useCallback(async (alertId: string, action: 'dismiss' | 'complete') => {
    setBusyAlertId(alertId);
    try {
      const response = await fetch(`/api/operator/alerts/${alertId}/${action}`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to update status');
      setAlerts((prev) => prev.filter((item) => item.id !== alertId));
    } catch (error) {
      console.error('ALERTS_PAGE_STATUS_ERROR', { alertId, action, error });
    } finally {
      setBusyAlertId(null);
    }
  }, []);

  return (
    <AppShell>
      <PremiumCard className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#eef2f7] p-2.5 text-zinc-200"><Bell className="h-5 w-5" /></div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-[#22262c]">Operator Alerts</h1>
              <p className="text-sm text-[#8791a0]">High-signal risks and opportunities across your account.</p>
            </div>
          </div>
          <SmartButton variant="secondary" onClick={() => void evaluateAlerts()} disabled={refreshing} className="px-3 py-2 text-xs">
            <RefreshCw className={`mr-1.5 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </SmartButton>
        </div>

        <PremiumCard className="bg-white/[0.02] p-4">
          <SectionHeader title="Alert summary" subtitle="Mission-critical status" />
          <div className="grid gap-2 text-sm text-[#4e5662]">
            <p><span className="font-semibold text-[#22262c]">Top risk:</span> {summary.top?.title || 'None detected'}</p>
            <p><span className="font-semibold text-[#22262c]">Potential monthly savings:</span> {currency(summary.potentialSavings)}</p>
            <p><span className="font-semibold text-[#22262c]">Recommended next action:</span> {summary.recommendedNextAction}</p>
          </div>
        </PremiumCard>

        {loading ? (
          <PremiumCard className="shimmer px-4 py-4 text-sm text-[#8791a0]">Loading operator alerts…</PremiumCard>
        ) : activeAlerts.length === 0 ? (
          <EmptyState title="No urgent issues detected" message="Your system is stable. We’ll notify you when an important action appears." />
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <PremiumCard key={alert.id} className="space-y-3 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <ActionRow title={alert.title} description={alert.summary} icon={<TriangleAlert className="h-4 w-4" />} />
                  <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase ${severityStyle[alert.severity]}`}>{alert.severity}</span>
                </div>
                <div className="grid gap-1.5 text-xs text-[#4e5662]">
                  <p><span className="font-semibold text-[#22262c]">Why it matters:</span> {metadataText(alert, 'why_it_matters', alert.summary)}</p>
                  <p><span className="font-semibold text-[#22262c]">Estimated impact:</span> {metadataText(alert, 'estimated_impact', 'Impact estimate unavailable')}</p>
                  <p><span className="font-semibold text-[#22262c]">Suggested action:</span> {alert.suggested_action}</p>
                  <p><span className="font-semibold text-[#22262c]">Confidence:</span> {metadataText(alert, 'confidence', '0.65')}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <SmartButton variant="secondary" onClick={() => void handleStatus(alert.id, 'dismiss')} disabled={busyAlertId === alert.id} className="w-full">
                    <XCircle className="mr-1.5 h-3.5 w-3.5" /> Dismiss
                  </SmartButton>
                  <SmartButton onClick={() => void handleStatus(alert.id, 'complete')} disabled={busyAlertId === alert.id} className="w-full">
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark completed
                  </SmartButton>
                </div>
                <p className="inline-flex items-center gap-1 text-[11px] text-[#8791a0]">
                  <CircleDashed className="h-3.5 w-3.5" /> Updated {new Date(alert.updated_at).toLocaleString()}
                </p>
              </PremiumCard>
            ))}
          </div>
        )}
      </PremiumCard>
    </AppShell>
  );
}
