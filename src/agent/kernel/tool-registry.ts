export type KernelToolName =
  | 'memory.search'
  | 'memory.write'
  | 'tasks.plan'
  | 'productivity.next_action'
  | 'compare.smart'
  | 'finance.analyze'
  | 'gmail.status'
  | 'gmail.inbox_summary'
  | 'gmail.finance_scan'
  | 'calendar.status'
  | 'calendar.today'
  | 'calendar.search'
  | 'calendar.create_event'
  | 'calendar.plan_day';

export type KernelToolContext = {
  userId?: string;
  conversationId?: string;
};

export type KernelToolResult = {
  tool: KernelToolName;
  ok: boolean;
  summary: string;
  data?: Record<string, unknown>;
};

export type KernelToolDefinition = {
  name: KernelToolName;
  title: string;
  description: string;
};

export const KERNEL_TOOL_REGISTRY: KernelToolDefinition[] = [
  {
    name: 'memory.search',
    title: 'Memory Search',
    description: 'Find relevant prior context, goals, and project details.',
  },
  {
    name: 'memory.write',
    title: 'Memory Write',
    description: 'Capture durable user preferences, goals, and project facts for future runs.',
  },
  {
    name: 'tasks.plan',
    title: 'Task Planner',
    description: 'Turn a request into a step-by-step plan or checklist.',
  },
  {
    name: 'productivity.next_action',
    title: 'Next Action',
    description: 'Find the best immediate next action for the user.',
  },
  {
    name: 'compare.smart',
    title: 'Smart Compare',
    description: 'Compare options and surface the key tradeoffs.',
  },
  {
    name: 'finance.analyze',
    title: 'Finance Analyze',
    description: 'Analyze money-related prompts for savings, leaks, or decisions.',
  },
  {
    name: 'gmail.status',
    title: 'Gmail Status',
    description: 'Check whether Gmail is connected and summarize the latest sync state.',
  },
  {
    name: 'gmail.inbox_summary',
    title: 'Gmail Inbox Summary',
    description: 'Summarize the latest available Gmail intelligence for priorities and follow-up.',
  },
  {
    name: 'gmail.finance_scan',
    title: 'Gmail Finance Scan',
    description: 'Use Gmail-derived finance signals to find subscriptions, recurring payments, and savings opportunities.',
  },
  {
    name: 'calendar.status',
    title: 'Calendar Status',
    description: 'Check whether Google Calendar is connected and ready.',
  },
  {
    name: 'calendar.today',
    title: 'Today Calendar',
    description: 'Fetch today’s calendar events.',
  },
  {
    name: 'calendar.search',
    title: 'Calendar Search',
    description: 'Search calendar events inside a time range.',
  },
  {
    name: 'calendar.create_event',
    title: 'Create Calendar Event',
    description: 'Create a new event in Google Calendar.',
  },
  {
    name: 'calendar.plan_day',
    title: 'Calendar Day Planner',
    description: 'Combine today’s calendar with task context to recommend a practical day plan.',
  },
];
