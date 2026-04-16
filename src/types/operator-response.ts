export type OperatorActionKind =
  | 'task'
  | 'decision'
  | 'finance'
  | 'planning'
  | 'prioritization'
  | 'comparison'
  | 'execution'
  | 'productivity'
  | 'general'
  | 'premium'
  | 'schedule'
  | 'message'
  | 'research'
  | 'follow_up';

export type OperatorActionBehavior =
  | 'enqueue_prompt'
  | 'navigate'
  | 'open_flow';

export type OperatorAction = {
  id: string;
  label: string;
  kind: OperatorActionKind;
  prompt?: string;
  behavior?: OperatorActionBehavior;
  route?: string;
  detail?: string;
  payload?: Record<string, unknown>;
};

export type OperatorResponse = {
  answer: string;
  nextStep?: string;
  actions?: OperatorAction[];
  decisionBrief?: string;
  risk?: string;
  opportunity?: string;
  savingsOpportunity?: string;
  timeOpportunity?: string;
};
