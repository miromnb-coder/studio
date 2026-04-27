import type { Agent, Conversation, Message, UserProfile } from '@/app/store/app-store-types';
import type {
  LibraryAgentCard,
  LibraryData,
  LibraryEvent,
  LibrarySavedItem,
  LibraryTask,
} from '../types';

type LibrarySource = {
  user: UserProfile | null;
  conversations: Conversation[];
  messageState: Record<string, Message[]>;
  agents: Record<string, Agent>;
};

function safeJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function formatRelativeTime(input?: string | null) {
  if (!input) return 'No recent activity';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'No recent activity';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function toClockLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildTasks(stats: Record<string, any>, events: LibraryEvent[]): LibraryTask[] {
  const todayTasks = Number(stats.tasks ?? 0);

  return [
    {
      id: 'task-1',
      title: 'Review priority inbox threads',
      subtitle: 'Email Agent queue',
      status: todayTasks > 0 ? 'today' : 'in_progress',
      dueLabel: 'Today',
      priority: 'high',
    },
    {
      id: 'task-2',
      title: 'Prepare key project update',
      subtitle: 'Builder Agent support',
      status: 'in_progress',
      dueLabel: 'Today',
    },
    {
      id: 'task-3',
      title: 'Protect deep work block',
      subtitle: events[0] ? `${events[0].title} scheduled` : 'No event blocks yet',
      status: 'upcoming',
      dueLabel: 'Next',
    },
    {
      id: 'task-4',
      title: 'Close completed follow-ups',
      subtitle: 'Move resolved items to archive',
      status: 'done',
      dueLabel: 'Done',
    },
  ];
}

function buildAgents(agents: Record<string, Agent>): LibraryAgentCard[] {
  const mapped = Object.values(agents);
  const seeded = [
    { id: 'personal', title: 'Personal Operator', sourceName: 'Supervisor Agent' },
    { id: 'email', title: 'Email Agent', sourceName: 'Research Agent' },
    { id: 'calendar', title: 'Calendar Agent', sourceName: 'Analysis Agent' },
    { id: 'finance', title: 'Finance Agent', sourceName: 'Memory Agent' },
    { id: 'builder', title: 'Builder Agent', sourceName: 'Response Agent' },
  ];

  return seeded.map((item, index) => {
    const linked = mapped.find((agent) => agent.name === item.sourceName) ?? mapped[index];
    const active = linked?.status === 'running' || linked?.status === 'completed';

    return {
      id: item.id,
      title: item.title,
      subtitle:
        item.title === 'Personal Operator'
          ? 'Handles your daily priorities'
          : item.title === 'Email Agent'
            ? 'Manages inbox and follow-ups'
            : item.title === 'Calendar Agent'
              ? 'Optimizes schedule and slots'
              : item.title === 'Finance Agent'
                ? 'Tracks trends and spending'
                : 'Builds workflows and automations',
      enabled: linked ? linked.status !== 'idle' : index !== 4,
      status: active ? 'active' : 'idle',
      lastActivity: formatRelativeTime(linked?.lastRun),
    };
  });
}

export function getLibraryData(source: LibrarySource): LibraryData {
  const storedUser = safeJson<Record<string, any>>(typeof window !== 'undefined' ? localStorage.getItem('kivo.user') : null, {});
  const stats = safeJson<Record<string, any>>(typeof window !== 'undefined' ? localStorage.getItem('kivo.stats') : null, {});
  const usage = safeJson<Record<string, any>>(typeof window !== 'undefined' ? localStorage.getItem('kivo.usage') : null, {});
  const memories = safeJson<any[]>(typeof window !== 'undefined' ? localStorage.getItem('kivo.memories') : null, []);
  const saved = safeJson<any[]>(typeof window !== 'undefined' ? localStorage.getItem('kivo.saved') : null, []);

  const userName =
    source.user?.name?.trim() ||
    String(storedUser.name || '').trim() ||
    'there';

  const events: LibraryEvent[] = source.conversations.slice(0, 3).map((conversation) => ({
    id: `event-${conversation.id}`,
    title: conversation.title,
    startLabel: toClockLabel(conversation.updatedAt),
    whenLabel: new Date(conversation.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
  }));

  const tasks = buildTasks(stats, events);
  const agentCards = buildAgents(source.agents);

  const timeline = events.length
    ? events.map((event, index) => ({
        id: `timeline-${event.id}`,
        label: index === 0 ? 'Now' : `${10 + index}.00`,
        title: event.title,
        timeRange: event.startLabel,
      }))
    : [
        { id: 'empty-1', label: 'Now', title: 'No events yet', timeRange: 'Add your first calendar sync' },
      ];

  const memorySaved: LibrarySavedItem[] = memories.slice(0, 4).map((item, index) => ({
    id: String(item.id || `memory-${index}`),
    type: 'memory',
    title: String(item.text || item.title || 'Saved memory'),
    subtitle: String(item.category || 'Memory item'),
    savedAtLabel: formatRelativeTime(item.createdAt),
  }));

  const bookmarkSaved: LibrarySavedItem[] = saved.slice(0, 4).map((item, index) => ({
    id: String(item.id || `saved-${index}`),
    type: 'bookmark',
    title: String(item.title || item.name || 'Saved item'),
    subtitle: String(item.note || item.preview || item.type || 'Bookmark'),
    savedAtLabel: String(item.savedAt || item.date || 'Saved'),
  }));

  const conversationSaved: LibrarySavedItem[] = source.conversations.slice(0, 2).map((conversation) => ({
    id: `conv-${conversation.id}`,
    type: 'answer',
    title: conversation.title,
    subtitle: conversation.lastMessagePreview || 'Recent answer',
    savedAtLabel: toClockLabel(conversation.updatedAt),
  }));

  const savedItems = [...bookmarkSaved, ...memorySaved, ...conversationSaved].slice(0, 8);

  return {
    userName,
    greeting: `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${userName}`,
    focusProgress: Math.max(20, Math.min(96, Math.round((Number(usage.messages ?? 0) / Math.max(Number(stats.conversations ?? 1), 1)) * 20) || 60)),
    aiSuggestion:
      source.conversations[0]?.lastMessagePreview ||
      'I can summarize your latest conversations and prepare your top 3 priorities.',
    conversations: source.conversations,
    conversationMessages: source.messageState,
    tasks,
    events,
    agents: agentCards,
    timeline,
    savedItems,
    appAgents: source.agents,
  };
}
