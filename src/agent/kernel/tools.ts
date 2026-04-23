import type { KernelRequest } from './types';
import type {
  KernelToolContext,
  KernelToolName,
  KernelToolResult,
} from './tool-registry';

function lower(text: string) {
  return text.toLowerCase();
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function extractDateTimeStrings(text: string): string[] {
  const isoMatches =
    text.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[+-]\d{2}:\d{2})?/g) ??
    [];
  return isoMatches;
}

function inferTodayWindow() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  };
}

function inferSearchWindow(text: string) {
  const normalized = lower(text);

  if (normalized.includes('today')) {
    return inferTodayWindow();
  }

  const now = new Date();

  if (normalized.includes('tomorrow')) {
    const start = new Date(now);
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
    };
  }

  if (normalized.includes('this week') || normalized.includes('next 7 days')) {
    const start = new Date(now);
    const end = new Date(now);
    end.setDate(end.getDate() + 7);

    return {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
    };
  }

  return {
    timeMin: undefined,
    timeMax: undefined,
  };
}

function inferCreatePayload(text: string): {
  title: string;
  start?: string;
  end?: string;
  description?: string;
  location?: string;
} {
  const trimmed = text.trim();
  const dateTimes = extractDateTimeStrings(trimmed);

  const title =
    trimmed
      .replace(/create (a )?(calendar )?(meeting|event)/i, '')
      .replace(/for\s+\d{4}-\d{2}-\d{2}.*/i, '')
      .replace(/\s+/g, ' ')
      .trim() || 'New event';

  let start: string | undefined;
  let end: string | undefined;

  if (dateTimes[0]) start = new Date(dateTimes[0]).toISOString();
  if (dateTimes[1]) end = new Date(dateTimes[1]).toISOString();

  if (start && !end) {
    const next = new Date(start);
    next.setHours(next.getHours() + 1);
    end = next.toISOString();
  }

  return {
    title,
    start,
    end,
  };
}

async function callJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof (payload as any)?.message === 'string'
        ? (payload as any).message
        : typeof (payload as any)?.error === 'string'
          ? (payload as any).error
          : `Request failed (${response.status})`;

    throw new Error(message);
  }

  return payload as T;
}

export async function runMemorySearchTool(
  request: KernelRequest,
  context: KernelToolContext,
): Promise<KernelToolResult> {
  return {
    tool: 'memory.search',
    ok: true,
    summary: 'Checked for prior context related to the user request.',
    data: {
      userId: context.userId ?? null,
      found: false,
      notes: [],
    },
  };
}

export async function runTasksPlanTool(
  request: KernelRequest,
): Promise<KernelToolResult> {
  const content = request.message.trim();

  return {
    tool: 'tasks.plan',
    ok: true,
    summary: 'Built a lightweight execution plan.',
    data: {
      steps: [
        `Understand the goal behind: "${content.slice(0, 80)}"`,
        'Identify the most useful response structure',
        'Produce a clear action-oriented answer',
      ],
    },
  };
}

export async function runNextActionTool(
  request: KernelRequest,
): Promise<KernelToolResult> {
  const text = lower(request.message);

  let nextAction = 'Clarify the goal and give the best next step.';

  if (text.includes('build') || text.includes('create')) {
    nextAction = 'Break the build into the first concrete implementation step.';
  } else if (text.includes('money') || text.includes('save')) {
    nextAction = 'Identify the biggest savings opportunity first.';
  } else if (text.includes('plan') || text.includes('schedule')) {
    nextAction = 'Turn the request into a prioritized plan.';
  } else if (text.includes('calendar') || text.includes('meeting')) {
    nextAction = 'Check schedule constraints before proposing a calendar action.';
  }

  return {
    tool: 'productivity.next_action',
    ok: true,
    summary: 'Identified the best immediate next action.',
    data: {
      nextAction,
    },
  };
}

export async function runCompareSmartTool(
  request: KernelRequest,
): Promise<KernelToolResult> {
  return {
    tool: 'compare.smart',
    ok: true,
    summary: 'Prepared a comparison frame for evaluating options.',
    data: {
      dimensions: ['cost', 'speed', 'quality', 'complexity', 'future-proofing'],
      prompt: request.message,
    },
  };
}

export async function runFinanceAnalyzeTool(
  request: KernelRequest,
): Promise<KernelToolResult> {
  const text = lower(request.message);

  return {
    tool: 'finance.analyze',
    ok: true,
    summary: 'Analyzed the request for finance-related opportunities.',
    data: {
      category:
        text.includes('subscription') || text.includes('monthly')
          ? 'subscriptions'
          : text.includes('budget') || text.includes('save')
            ? 'budgeting'
            : 'general_finance',
      likelyOpportunity:
        text.includes('save') || text.includes('money')
          ? 'Potential savings opportunity detected.'
          : 'No strong finance pattern detected.',
    },
  };
}

export async function runCalendarStatusTool(): Promise<KernelToolResult> {
  try {
    const payload = await callJson<{
      connected?: boolean;
      status?: string;
      accountEmail?: string | null;
      permissions?: string[];
      errorMessage?: string | null;
    }>('/api/integrations/google-calendar/status');

    return {
      tool: 'calendar.status',
      ok: Boolean(payload.connected),
      summary: payload.connected
        ? 'Google Calendar is connected.'
        : 'Google Calendar is not connected.',
      data: {
        connected: Boolean(payload.connected),
        status: payload.status ?? null,
        accountEmail: payload.accountEmail ?? null,
        permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
        errorMessage: payload.errorMessage ?? null,
      },
    };
  } catch (error) {
    return {
      tool: 'calendar.status',
      ok: false,
      summary:
        error instanceof Error
          ? error.message
          : 'Failed to check Google Calendar status.',
    };
  }
}

export async function runCalendarTodayTool(): Promise<KernelToolResult> {
  try {
    const payload = await callJson<{
      events?: Array<Record<string, unknown>>;
      count?: number;
      calendarId?: string;
    }>('/api/integrations/google-calendar/events?mode=today');

    const events = Array.isArray(payload.events) ? payload.events : [];

    return {
      tool: 'calendar.today',
      ok: true,
      summary:
        events.length > 0
          ? `Fetched ${events.length} event${events.length === 1 ? '' : 's'} for today.`
          : 'No events found for today.',
      data: {
        events,
        count: typeof payload.count === 'number' ? payload.count : events.length,
        calendarId: payload.calendarId ?? 'primary',
      },
    };
  } catch (error) {
    return {
      tool: 'calendar.today',
      ok: false,
      summary:
        error instanceof Error
          ? error.message
          : 'Failed to fetch today’s calendar events.',
    };
  }
}

export async function runCalendarSearchTool(
  request: KernelRequest,
): Promise<KernelToolResult> {
  try {
    const window = inferSearchWindow(request.message);
    const query = new URLSearchParams();

    if (window.timeMin) query.set('timeMin', window.timeMin);
    if (window.timeMax) query.set('timeMax', window.timeMax);
    query.set('maxResults', '50');

    const payload = await callJson<{
      events?: Array<Record<string, unknown>>;
      count?: number;
      calendarId?: string;
    }>(`/api/integrations/google-calendar/events?${query.toString()}`);

    const events = Array.isArray(payload.events) ? payload.events : [];

    return {
      tool: 'calendar.search',
      ok: true,
      summary:
        events.length > 0
          ? `Found ${events.length} calendar event${events.length === 1 ? '' : 's'}.`
          : 'No matching calendar events found.',
      data: {
        events,
        count: typeof payload.count === 'number' ? payload.count : events.length,
        calendarId: payload.calendarId ?? 'primary',
        timeMin: window.timeMin ?? null,
        timeMax: window.timeMax ?? null,
      },
    };
  } catch (error) {
    return {
      tool: 'calendar.search',
      ok: false,
      summary:
        error instanceof Error
          ? error.message
          : 'Failed to search calendar events.',
    };
  }
}

export async function runCalendarCreateEventTool(
  request: KernelRequest,
): Promise<KernelToolResult> {
  const inferred = inferCreatePayload(request.message);

  if (!inferred.start || !inferred.end) {
    return {
      tool: 'calendar.create_event',
      ok: false,
      summary:
        'Could not infer event start and end time. Provide explicit ISO times.',
      data: inferred,
    };
  }

  try {
    const payload = await callJson<{
      success?: boolean;
      event?: Record<string, unknown>;
    }>('/api/integrations/google-calendar/create', {
      method: 'POST',
      body: JSON.stringify({
        title: inferred.title,
        start: inferred.start,
        end: inferred.end,
        description: inferred.description,
        location: inferred.location,
      }),
    });

    return {
      tool: 'calendar.create_event',
      ok: Boolean(payload.success),
      summary: payload.success
        ? 'Created calendar event successfully.'
        : 'Calendar event creation did not complete.',
      data: {
        event: payload.event ?? null,
      },
    };
  } catch (error) {
    return {
      tool: 'calendar.create_event',
      ok: false,
      summary:
        error instanceof Error
          ? error.message
          : 'Failed to create calendar event.',
      data: inferred,
    };
  }
}

export async function runKernelTool(
  tool: KernelToolName,
  request: KernelRequest,
  context: KernelToolContext,
): Promise<KernelToolResult> {
  switch (tool) {
    case 'memory.search':
      return runMemorySearchTool(request, context);
    case 'tasks.plan':
      return runTasksPlanTool(request);
    case 'productivity.next_action':
      return runNextActionTool(request);
    case 'compare.smart':
      return runCompareSmartTool(request);
    case 'finance.analyze':
      return runFinanceAnalyzeTool(request);
    case 'calendar.status':
      return runCalendarStatusTool();
    case 'calendar.today':
      return runCalendarTodayTool();
    case 'calendar.search':
      return runCalendarSearchTool(request);
    case 'calendar.create_event':
      return runCalendarCreateEventTool(request);
    default:
      return {
        tool,
        ok: false,
        summary: `Unknown tool: ${tool}`,
      };
  }
}
