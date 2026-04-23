export type KernelToolName =
  | 'memory.search'
  | 'tasks.plan'
  | 'productivity.next_action'
  | 'compare.smart'
  | 'finance.analyze'
  | 'calendar.status'
  | 'calendar.today'
  | 'calendar.search'
  | 'calendar.create_event';

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
];
