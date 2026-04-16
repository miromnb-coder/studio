export type OperatorActionKind =
  | 'task'
  | 'decision'
  | 'finance'
  | 'productivity'
  | 'general'
  | 'premium'
  | 'schedule'
  | 'message'
  | 'research'
  | 'follow_up';

export type OperatorAction = {
  id: string;
  label: string;
  kind: OperatorActionKind;
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
