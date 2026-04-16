import type {
  AgentResponse,
  AgentResponseMetadata,
} from '@/types/agent-response';
import type { FinanceActionType } from '@/lib/finance/types';

export type AgentName =
  | 'Supervisor Agent'
  | 'Research Agent'
  | 'Analysis Agent'
  | 'Memory Agent'
  | 'Response Agent';

export type AgentStatus = 'idle' | 'running' | 'completed';
export type MessageRole = 'user' | 'assistant' | 'system';
export type HistoryType = 'message' | 'agent' | 'alert' | 'memory' | 'account';
export type AlertType = 'billing' | 'risk' | 'digest';
export type MessageAttachmentKind = 'image' | 'file';

export type MessageAttachment = {
  id: string;
  name: string;
  kind: MessageAttachmentKind;
  mimeType: string;
  size: number;
  previewUrl?: string;
};

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  attachments?: MessageAttachment[];
  agent?: AgentName;
  isStreaming?: boolean;
  error?: string;
  agentMetadata?: AgentResponseMetadata;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
  messageCount: number;
};

export type Agent = {
  name: AgentName;
  status: AgentStatus;
  lastRun: string | null;
  lastTask: string | null;
};

export type Alert = {
  id: string;
  title: string;
  description: string;
  type: AlertType;
  createdAt: string;
  resolved: boolean;
  snoozedUntil: string | null;
};

export type HistoryEntry = {
  id: string;
  title: string;
  description: string;
  type: HistoryType;
  createdAt: string;
  prompt?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
};

export type AgentStep = {
  id: string;
  label: string;
  status: 'running' | 'completed' | 'failed';
};

export type AppState = {
  hydrated: boolean;
  user: UserProfile | null;
  conversationList: Conversation[];
  activeConversationId: string;
  messageState: Record<string, Message[]>;
  draftState: Record<string, string>;
  messages: Message[];
  draftPrompt: string;
  agents: Record<AgentName, Agent>;
  alerts: Alert[];
  history: HistoryEntry[];
  activeAgent: AgentName | null;
  isAgentResponding: boolean;
  activeRequestId: string | null;
  streamError: string | null;
  activeSteps: AgentStep[];
};

export type AppActions = {
  hydrate: () => void;
  setDraftPrompt: (prompt: string) => void;
  sendMessage: (
    prompt: string,
    options?: { attachments?: MessageAttachment[] },
  ) => Promise<void>;
  retryLastPrompt: () => Promise<void>;
  enqueuePromptAndGoToChat: (prompt: string) => void;
  addAlert: (
    alert: Omit<Alert, 'id' | 'createdAt' | 'resolved' | 'snoozedUntil'>,
  ) => void;
  resolveAlert: (alertId: string) => void;
  snoozeAlert: (alertId: string, minutes?: number) => void;
  markAlertFalsePositive: (alertId: string) => void;
  openAlertInChat: (alertId: string, mode?: 'analyze' | 'open') => void;
  setUser: (user: UserProfile) => void;
  clearUser: () => void;
  updateUserName: (name: string) => void;
  logout: () => void;
  createConversation: () => string;
  openConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  renameConversation: (conversationId: string, title: string) => void;
  runFinanceAction: (
    sourceMessageId: string,
    actionType: FinanceActionType,
  ) => Promise<{ ok: boolean; errorCode?: string }>;
};

export type AgentStepLike = {
  id?: string;
  action?: string;
  label?: string;
  status?: string;
  summary?: string;
  error?: string;
  tool?: string;
};

export type AgentStructuredDataLike = {
  route?: { confidence?: number };
  evaluation?: { score?: number; passed?: boolean; issues?: string[] };
  toolResults?: Array<{ tool?: string; ok?: boolean }>;
  memory?: { items?: unknown[] };
};

export type ChatStreamEvent =
  | {
      type:
        | 'router_started'
        | 'router_completed'
        | 'planning_started'
        | 'planning_completed'
        | 'memory_started'
        | 'memory_completed'
        | 'tool_started'
        | 'tool_completed';
      stepId?: string;
      label?: string;
      summary?: string;
      tool?: string;
      status?: string;
      error?: string;
      requestId?: string;
    }
  | {
      type: 'answer_delta';
      delta?: string;
      emittedChars?: number;
      requestId?: string;
    }
  | {
      type: 'answer_completed';
      content?: string;
      metadata?: AgentResponseMetadata;
      metrics?: { ttfbMs?: number; completionMs?: number; charCount?: number };
      requestId?: string;
    };

export type NormalizedAgentResponse = AgentResponse;
