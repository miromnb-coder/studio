import { CHAT_DRAFT_KEY, makeMessage, readChatMessages, writeChatMessages } from './chat-store';

export type AlertType = 'billing' | 'risk' | 'digest';

export type AlertRecord = {
  id: string;
  title: string;
  description: string;
  type: AlertType;
  createdAt: string;
  resolved: boolean;
  snoozedUntil?: string;
};

export type AlertHistoryEvent = {
  id: string;
  alertId: string;
  action: 'open_chat' | 'analyze_ai' | 'snooze' | 'resolve';
  label: string;
  createdAt: string;
};

export type HomeMetrics = {
  activeAlerts: number;
  resolvedAlerts: number;
  snoozedAlerts: number;
  totalAlertActions: number;
  lastActionAt: string | null;
};

export const ALERTS_STORAGE_KEY = 'operator_alert_records_v1';
export const ALERT_HISTORY_KEY = 'operator_alert_history_v1';
export const HOME_METRICS_KEY = 'operator_home_metrics_v1';

function initialAlerts(): AlertRecord[] {
  return [
    {
      id: 'alert-subscription-renewal',
      title: 'Subscription renewal due soon',
      description: 'Subscription renewal due in 3 days.',
      type: 'billing',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      resolved: false,
    },
    {
      id: 'alert-duplicate-billing',
      title: 'Potential duplicate billing',
      description: 'Potential duplicate billing detected.',
      type: 'risk',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      resolved: false,
    },
    {
      id: 'alert-weekly-digest',
      title: 'Weekly digest available',
      description: 'Weekly alert digest is ready for review.',
      type: 'digest',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      resolved: false,
    },
  ];
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readAlertRecords(): AlertRecord[] {
  const existing = safeRead<AlertRecord[]>(ALERTS_STORAGE_KEY, []);
  if (existing.length > 0) return existing;

  const seeded = initialAlerts();
  safeWrite(ALERTS_STORAGE_KEY, seeded);
  safeWrite(HOME_METRICS_KEY, computeHomeMetrics(seeded, []));
  return seeded;
}

export function writeAlertRecords(alerts: AlertRecord[]) {
  safeWrite(ALERTS_STORAGE_KEY, alerts);
}

export function readAlertHistory(): AlertHistoryEvent[] {
  return safeRead<AlertHistoryEvent[]>(ALERT_HISTORY_KEY, []);
}

export function writeAlertHistory(events: AlertHistoryEvent[]) {
  safeWrite(ALERT_HISTORY_KEY, events);
}

export function readHomeMetrics(): HomeMetrics {
  return safeRead<HomeMetrics>(HOME_METRICS_KEY, {
    activeAlerts: 0,
    resolvedAlerts: 0,
    snoozedAlerts: 0,
    totalAlertActions: 0,
    lastActionAt: null,
  });
}

export function computeHomeMetrics(alerts: AlertRecord[], history: AlertHistoryEvent[]): HomeMetrics {
  const now = Date.now();
  const activeAlerts = alerts.filter((alert) => !alert.resolved && !isSnoozed(alert, now)).length;
  const resolvedAlerts = alerts.filter((alert) => alert.resolved).length;
  const snoozedAlerts = alerts.filter((alert) => !alert.resolved && isSnoozed(alert, now)).length;

  return {
    activeAlerts,
    resolvedAlerts,
    snoozedAlerts,
    totalAlertActions: history.length,
    lastActionAt: history[0]?.createdAt ?? null,
  };
}

export function persistAlertState(alerts: AlertRecord[], history: AlertHistoryEvent[]) {
  writeAlertRecords(alerts);
  writeAlertHistory(history);
  safeWrite(HOME_METRICS_KEY, computeHomeMetrics(alerts, history));
}

export function makeAlertHistoryEvent(
  alertId: string,
  action: AlertHistoryEvent['action'],
  label: string,
): AlertHistoryEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    alertId,
    action,
    label,
    createdAt: new Date().toISOString(),
  };
}

export function buildAlertPrompt(alert: AlertRecord, actionHint: string): string {
  return `${actionHint}\nAlert: ${alert.title}\nDetails: ${alert.description}\nType: ${alert.type}.`;
}

export function sendAlertPromptToChat(alert: AlertRecord, actionHint: string, source: 'home' | 'agents' = 'home') {
  const prompt = buildAlertPrompt(alert, actionHint);
  const messages = readChatMessages();
  writeChatMessages([...messages, makeMessage('user', prompt, source)]);
  window.localStorage.setItem(CHAT_DRAFT_KEY, prompt);
}

export function runAlertAnalysisInChat(alert: AlertRecord) {
  const prompt = buildAlertPrompt(alert, 'Analyze this alert, prioritize urgency, and suggest the next 3 operator actions.');
  const messages = readChatMessages();
  writeChatMessages([
    ...messages,
    makeMessage('user', prompt, 'home'),
    makeMessage('assistant', `Queued analysis for \"${alert.title}\". I will prepare triage and action steps.`, 'home'),
  ]);
  window.localStorage.setItem(CHAT_DRAFT_KEY, prompt);
}

export function isSnoozed(alert: AlertRecord, now = Date.now()): boolean {
  if (!alert.snoozedUntil) return false;
  return new Date(alert.snoozedUntil).getTime() > now;
}
