export type AurenAgentVersion = 'v0.1-scaffold';

export type AurenMode =
  | 'general'
  | 'study'
  | 'today'
  | 'memory'
  | 'focus'
  | 'money';

export type AurenIntent =
  | 'general_chat'
  | 'study_help'
  | 'daily_planning'
  | 'save_memory'
  | 'recall_memory'
  | 'create_plan'
  | 'focus_help'
  | 'tool_request'
  | 'unknown';

export type AurenStepStatus = 'pending' | 'running' | 'complete' | 'error' | 'skipped';

export type AurenAgentStep = {
  id: string;
  label: string;
  status: AurenStepStatus;
  detail?: string;
};

export type AurenConversationMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt?: string;
};

export type AurenAgentInput = {
  message: string;
  userId?: string;
  mode?: AurenMode;
  conversation?: AurenConversationMessage[];
  metadata?: Record<string, unknown>;
};

export type AurenAgentOptions = {
  now?: Date;
  enableTools?: boolean;
  enableMemoryWrite?: boolean;
};

export type AurenIntentResult = {
  intent: AurenIntent;
  confidence: number;
  reasons: string[];
  needsMemory: boolean;
  needsTools: boolean;
};

export type AurenUserContext = {
  userId?: string;
  displayName?: string;
  traits: string[];
  preferences: string[];
};

export type AurenEnvironmentContext = {
  currentDateISO: string;
  timezone?: string;
  platform?: string;
  locale?: string;
};

export type AurenMemoryItem = {
  id: string;
  type: 'user_preference' | 'study_goal' | 'active_project' | 'important_fact' | 'habit' | 'note';
  text: string;
  confidence: number;
  createdAt: string;
  source: 'chat' | 'system' | 'integration' | 'manual';
};

export type AurenMemoryState = {
  used: boolean;
  saved: boolean;
  items: AurenMemoryItem[];
};

export type AurenToolName = 'calendar' | 'gmail' | 'tasks' | 'notes' | 'study' | 'finance';

export type AurenToolStatus = 'available' | 'not_connected' | 'disabled' | 'error';

export type AurenToolResult = {
  tool: AurenToolName;
  status: AurenToolStatus;
  success: boolean;
  message: string;
  data?: unknown;
};

export type AurenSuggestion = {
  id: string;
  label: string;
  action: string;
  mode?: AurenMode;
};

export type AurenPlanStep = {
  id: string;
  title: string;
  description: string;
  status: AurenStepStatus;
};

export type AurenPlan = {
  goal: string;
  steps: AurenPlanStep[];
  needsTools: boolean;
  toolNames: AurenToolName[];
};

export type AurenContext = {
  version: AurenAgentVersion;
  input: AurenAgentInput;
  normalizedMessage: string;
  mode: AurenMode;
  intent: AurenIntentResult;
  user: AurenUserContext;
  environment: AurenEnvironmentContext;
  memory: AurenMemoryState;
};

export type AurenResponseEvaluation = {
  passed: boolean;
  score: number;
  notes: string[];
};

export type AurenAgentResult = {
  version: AurenAgentVersion;
  answer: string;
  mode: AurenMode;
  intent: AurenIntent;
  confidence: number;
  steps: AurenAgentStep[];
  plan: AurenPlan;
  suggestions: AurenSuggestion[];
  memory: AurenMemoryState;
  tools: {
    used: boolean;
    names: AurenToolName[];
    results: AurenToolResult[];
  };
  evaluation: AurenResponseEvaluation;
};

export type AurenAgentStreamEvent = {
  type: 'step' | 'token' | 'result' | 'error';
  payload: unknown;
};
