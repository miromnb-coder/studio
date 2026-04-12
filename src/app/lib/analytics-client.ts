'use client';

import { createAnalyticsSessionId, type AnalyticsEvent, type AnalyticsEventName } from '@/lib/analytics/events';

const SESSION_STORAGE_KEY = 'kivo-analytics-session';
const QUEUE_LIMIT = 40;

let sessionId: string | null = null;
let queue: AnalyticsEvent[] = [];
let flushTimer: number | null = null;

function getSessionId() {
  if (sessionId) return sessionId;
  if (typeof window === 'undefined') return createAnalyticsSessionId();

  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    sessionId = existing;
    return existing;
  }

  const next = createAnalyticsSessionId();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, next);
  sessionId = next;
  return next;
}

function flushQueue() {
  if (typeof window === 'undefined' || queue.length === 0) return;
  const events = [...queue];
  queue = [];

  fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({ events }),
  }).catch(() => {
    // no-op: analytics should never block UX
  });
}

export function trackEvent(
  name: AnalyticsEventName,
  fields?: Omit<AnalyticsEvent, 'name' | 'ts' | 'sessionId'>,
) {
  const event: AnalyticsEvent = {
    name,
    ts: new Date().toISOString(),
    sessionId: getSessionId(),
    ...fields,
  };

  queue.push(event);
  if (queue.length >= QUEUE_LIMIT) {
    flushQueue();
    return;
  }

  if (flushTimer) window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(() => {
    flushQueue();
    flushTimer = null;
  }, 1200);
}

if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushQueue();
  });
}
