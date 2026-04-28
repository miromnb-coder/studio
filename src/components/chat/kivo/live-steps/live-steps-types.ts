export type LiveStepStatus = 'queued' | 'running' | 'done' | 'error';

export type LiveStepKind =
  | 'understanding'
  | 'planning'
  | 'memory'
  | 'tool'
  | 'search'
  | 'calendar'
  | 'writing'
  | 'completed'
  | 'generic';

export type LiveStep = {
  id: string;
  kind: LiveStepKind;
  status: LiveStepStatus;
  label: string;
  subtitle?: string;
  at?: number;
  tool?: string;
  sourceEventType?: string;
  collapsible?: boolean;
};

export type LiveStepStreamEvent = {
  type: string;
  label?: string;
  status?: string;
  tool?: string;
  error?: string;
  at?: number;
};

export type LiveStepContext = {
  isStreaming?: boolean;
  elapsedMs?: number;
  reasoningDepth?: string;
  toolsUsed?: string[];
  memoryUsed?: boolean;
  taskDepth?: 'simple' | 'multi' | 'complex';
  mode?: string;
  contentLength?: number;
  latestUserContent?: string;
};
