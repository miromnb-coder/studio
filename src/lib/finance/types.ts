export type FinanceConfidence = 'low' | 'medium' | 'high';
export type FinanceLeakPeriod = 'monthly' | 'yearly' | 'one-time' | 'unknown';
export type FinanceLeakType =
  | 'subscription'
  | 'duplicate'
  | 'fee'
  | 'trial'
  | 'price_increase'
  | 'waste'
  | 'unknown';
export type FinanceLeakAction = 'cancel' | 'review' | 'downgrade' | 'consolidate' | 'monitor';
export type FinanceUrgency = 'low' | 'medium' | 'high';

export type FinanceLeak = {
  merchant: string;
  amount: number | null;
  currency: string | null;
  period: FinanceLeakPeriod;
  type: FinanceLeakType;
  reason: string;
  action: FinanceLeakAction;
  urgency: FinanceUrgency;
};

export type FinanceAnalysis = {
  estimatedMonthlySavings: number | null;
  currency: string | null;
  confidence: FinanceConfidence;
  leaks: FinanceLeak[];
  recommendations: string[];
};

export type FinanceActionType = 'create_savings_plan' | 'find_alternatives' | 'draft_cancellation';

export type FinanceActionResultType = 'savings_plan' | 'alternatives' | 'cancellation_draft' | 'error';

export type FinanceActionResult = {
  type: FinanceActionResultType;
  title: string;
  summary: string;
  data: Record<string, unknown>;
};
