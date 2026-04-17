export type ConnectorId = 'gmail' | 'google-calendar' | 'google-drive' | 'github' | 'outlook' | 'browser';

export type ConnectorState = 'not_connected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

export type ConnectorRecord = {
  id: ConnectorId;
  name: string;
  description: string;
  state: ConnectorState;
  accountEmail?: string | null;
  lastSyncAt?: string | null;
  permissions: string[];
  tools: string[];
  errorMessage?: string | null;
};

export const CONNECTOR_META: Record<ConnectorId, Omit<ConnectorRecord, 'state'>> = {
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    description:
      'Connect Gmail to search emails, detect subscriptions, scan receipts, and power automations.',
    accountEmail: null,
    lastSyncAt: null,
    permissions: ['Read inbox metadata', 'Search messages', 'Read labels'],
    tools: ['Inbox analysis', 'Subscription scan', 'Receipt scan', 'Search emails', 'Automation triggers'],
    errorMessage: null,
  },
  'google-calendar': {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync calendars to plan and automate scheduling workflows.',
    accountEmail: null,
    lastSyncAt: null,
    permissions: ['Read calendars', 'Read events'],
    tools: ['Today Planner', 'Find Focus Time', 'Check Busy Week', 'Weekly Reset'],
    errorMessage: null,
  },
  'google-drive': {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Search and use documents from Drive in workflows.',
    accountEmail: null,
    lastSyncAt: null,
    permissions: ['Read files metadata', 'Read shared files'],
    tools: ['File search', 'Recent docs', 'Workflow attachments'],
    errorMessage: null,
  },
  github: {
    id: 'github',
    name: 'GitHub',
    description: 'Connect repositories for code context and automation triggers.',
    accountEmail: null,
    lastSyncAt: null,
    permissions: ['Read repos', 'Read pull requests'],
    tools: ['Repo tools', 'PR summaries', 'Issue triage'],
    errorMessage: null,
  },
  outlook: {
    id: 'outlook',
    name: 'Outlook',
    description: 'Sync Outlook mailbox for enterprise email workflows.',
    accountEmail: null,
    lastSyncAt: null,
    permissions: ['Read mailbox', 'Read folders'],
    tools: ['Mailbox scan', 'Search email', 'Meeting digests'],
    errorMessage: null,
  },
  browser: {
    id: 'browser',
    name: 'Browser',
    description: 'Capture research from browser sessions and pages.',
    accountEmail: null,
    lastSyncAt: null,
    permissions: ['Capture active tab metadata'],
    tools: ['Research capture', 'Source tracker', 'Web summary'],
    errorMessage: null,
  },
};

const STORAGE_KEY = 'kivo_connector_states_v1';

export function getStoredConnectors(): Partial<Record<ConnectorId, ConnectorRecord>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<ConnectorId, ConnectorRecord>>;
  } catch {
    return {};
  }
}

export function saveConnectorRecord(id: ConnectorId, record: ConnectorRecord) {
  if (typeof window === 'undefined') return;
  const next = { ...getStoredConnectors(), [id]: record };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getConnectorRecord(id: ConnectorId): ConnectorRecord {
  const stored = getStoredConnectors()[id];
  return {
    ...CONNECTOR_META[id],
    state: 'not_connected',
    ...stored,
    id,
  };
}

export function formatSyncLabel(iso?: string | null) {
  if (!iso) return 'Never synced';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Never synced';
  return date.toLocaleString();
}
