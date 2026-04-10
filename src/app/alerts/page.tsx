'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, CircleDashed, RefreshCw, TriangleAlert, XCircle } from 'lucide-react';

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

const severityWeight: Record<AlertSeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function currency(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function parseSavings(alert: OperatorAlert): number {
  const metadata = alert.metadata || {};
  const direct = Number(metadata.potential_monthly_savings || metadata.monthly_total || metadata.monthly_amount || 0);
  return Number.isFinite(direct) ? Math.max(0, direct) : 0;
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
    <main className="screen app-bg">
      <section className="space-y-4 rounded-2xl bg-[#f7f7f7] p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#ececec] p-2.5 text-[#333]"><Bell className="h-5 w-5" /></div>
            <div>
              <h1 className="text-2xl font-semibold text-primary">Operator Alerts</h1>
              <p className="text-sm text-secondary">Calm, evidence-based priorities from your real finance signals.</p>
            </div>
          </div>
          <button
            onClick={() => void evaluateAlerts()}
            type="button"
            className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh analysis
          </button>
        </div>

        <article className="rounded-xl bg-[#f2f2f2] p-4">
          <h2 className="text-sm font-semibold text-primary">Operator Summary</h2>
          <div className="mt-2 grid gap-3 text-sm text-secondary md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#666]">Top priorities</p>
              <ul className="mt-1 space-y-1">
                {summary.topPriorities.length === 0 ? <li>No active issues.</li> : summary.topPriorities.map((item) => <li key={item.id}>• {item.title}</li>)}
              </ul>
            </div>
            <div className="space-y-1">
              <p><span className="text-xs uppercase tracking-wide text-[#666]">Potential monthly savings:</span> {currency(summary.potentialSavings)}</p>
              <p><span className="text-xs uppercase tracking-wide text-[#666]">Most important alert:</span> {summary.top?.title || 'None'}</p>
              <p><span className="text-xs uppercase tracking-wide text-[#666]">Recommended next action:</span> {summary.recommendedNextAction}</p>
            </div>
          </div>
        </article>

        {loading ? (
          <div className="rounded-xl bg-[#f2f2f2] px-4 py-4 text-sm text-secondary">Loading operator alerts…</div>
        ) : activeAlerts.length === 0 ? (
          <div className="rounded-xl bg-[#f2f2f2] px-4 py-4 text-sm text-secondary">No active alerts right now.</div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <article key={alert.id} className="rounded-xl bg-[#f2f2f2] px-4 py-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-[#e7e7e7] p-2 text-[#4a4a4a]"><TriangleAlert className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{alert.title}</p>
                      <p className="mt-1 text-sm text-secondary">{alert.summary}</p>
                      <p className="mt-2 text-xs text-[#555]"><span className="font-semibold">Next action:</span> {alert.suggested_action}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#e5e5e5] px-2 py-1 text-[11px] font-semibold uppercase text-[#444]">{alert.severity}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    onClick={() => void handleStatus(alert.id, 'dismiss')}
                    type="button"
                    disabled={busyAlertId === alert.id}
                    className="btn-secondary inline-flex items-center justify-center gap-1 px-2 py-2"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Dismiss
                  </button>
                  <button
                    onClick={() => void handleStatus(alert.id, 'complete')}
                    type="button"
                    disabled={busyAlertId === alert.id}
                    className="btn-primary inline-flex items-center justify-center gap-1 px-2 py-2"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark completed
                  </button>
                </div>
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#666]">
                  <CircleDashed className="h-3.5 w-3.5" /> Updated {new Date(alert.updated_at).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
