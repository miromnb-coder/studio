import { OperatorAlertRecord } from '@/lib/operator/alerts';
import { RecommendationOutcomeRecord } from '@/lib/operator/outcomes';
import { OperatorRecommendation } from '@/lib/operator/recommendations';
import { UserProfileIntelligence } from '@/lib/operator/personalization';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AgentIntentV8 =
  | 'general'
  | 'finance'
  | 'gmail'
  | 'productivity'
  | 'planning'
  | 'coding'
  | 'memory'
  | 'comparison'
  | 'decision'
  | 'emotional_support'
  | 'research'
  | 'unknown';

export type FinanceIntentSubtypeV8 =
  | 'subscriptions'
  | 'bills'
  | 'savings_audit'
  | 'compare_options'
  | 'budgeting'
  | 'cashflow'
  | 'alerts_review'
  | 'general_finance'
  | 'none';

export type PlanModeV8 = 'audit' | 'compare' | 'recommend' | 'act' | 'monitor' | 'clarify' | 'verify';

export type AgentModeV8 = 'general' | 'finance' | 'gmail' | 'productivity' | 'coding' | 'memory';
export type AgentRouteDepthV8 = 'light' | 'standard' | 'deep';


export type ResponseModeV8 = 'analyst' | 'coach' | 'operator' | 'researcher';

export type GoalUnderstandingV8 = {
  explicitRequest: string;
  hiddenRequest: string;
  inferredGoal: string;
  realObjective?: string;
  urgency: 'low' | 'medium' | 'high';
  blockerLevel: 'none' | 'some' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  effortTolerance: 'low' | 'medium' | 'high';
  speedVsDepth: 'speed' | 'balanced' | 'depth';
  decisionType: 'informational' | 'choice' | 'execution' | 'emotional';
  userConfidenceLevel: 'low' | 'medium' | 'high';
  horizon: 'immediate' | 'short_term' | 'long_term';
  preferredStyle: 'concise' | 'structured' | 'detailed' | 'supportive';
  category: 'cashflow' | 'savings' | 'debt' | 'subscriptions' | 'planning' | 'general';
  hiddenOpportunities: string[];
  priorityLens?: Array<'impact' | 'urgency' | 'effort' | 'certainty' | 'risk_reduction' | 'speed'>;
  missingCriticalData?: string[];
  emotionalTone: 'neutral' | 'stressed' | 'overwhelmed' | 'motivated';
  inputLanguage: string;
  responseLanguage: string;
};

export type AgentRole = 'system' | 'assistant' | 'user';

export type AgentMessageV8 = {
  role: AgentRole;
  content: string;
};

export type ProductStateV8 = {
  plan: 'FREE' | 'PREMIUM';
  usage: {
    current: number;
    limit: number;
    remaining: number;
  };
  gmailConnected: boolean;
};

export type MemoryEnvelopeV8 = {
  summaryType?: 'finance' | 'general';
  summary?: string;
  financeProfile?: Record<string, unknown> | null;
  financeEvents?: Array<Record<string, unknown>>;
  semanticMemories?: Array<Record<string, unknown>>;
  summaries?: Array<Record<string, unknown>>;
};

export type UserMemoryTypeV8 = 'preference' | 'fact' | 'goal' | 'finance' | 'other';

export type UserMemoryItemV8 = {
  id?: string;
  userId: string;
  content: string;
  type: UserMemoryTypeV8;
  importance: number;
  relevanceScore?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type DecisionContextV8 = {
  activeGoal: string | null;
  knownConstraints: string[];
  recentActions: string[];
  decisionHistory: string[];
  previousRecommendations: string[];
  successfulRecommendationIds: string[];
  deprioritizedRecommendationIds: string[];
  currentFinancialPressure: 'low' | 'medium' | 'high' | 'unknown';
  userPreferences: string[];
};

export type AgentContextV8 = {
  supabase: SupabaseClient;
  user: {
    id: string;
    message: string;
  };
  conversation: AgentMessageV8[];
  memory: {
    summary: string;
    summaryType: 'finance' | 'general';
    financeProfile?: Record<string, unknown> | null;
    financeEvents?: Array<Record<string, unknown>>;
    semanticMemories?: Array<Record<string, unknown>>;
    relevantMemories: UserMemoryItemV8[];
  };
  intelligence: {
    operatorAlerts: OperatorAlertRecord[];
    recommendations: OperatorRecommendation[];
    outcomes: RecommendationOutcomeRecord[];
    userProfile: UserProfileIntelligence | null;
    gmailFinanceSummary: Record<string, unknown> | null;
  };
  decisionContext: DecisionContextV8;
  environment: {
    gmailConnected: boolean;
    productState: ProductStateV8;
    nowIso: string;
  };
};

export type RouteResultV8 = {
  intent: AgentIntentV8;
  subtype: FinanceIntentSubtypeV8;
  mode: AgentModeV8;
  confidence: number;
  ambiguity: number;
  shouldClarify: boolean;
  userState: {
    stress: number;
    urgency: number;
    confusion: number;
  };
  reason: string;
  responseMode: ResponseModeV8;
  goal: GoalUnderstandingV8;
  needsGmail: boolean;
  needsFinanceData: boolean;
  wantsRecommendations: boolean;
  inputLanguage: string;
  responseLanguage: string;
};

export type ToolNameV8 =
  | 'gmail_fetch'
  | 'finance_read'
  | 'finance_compare_options'
  | 'savings_plan_generator'
  | 'subscription_cancel_draft'
  | 'cashflow_summary'
  | 'price_change_detector'
  | 'generate_recommendations'
  | 'detect_leaks'
  | 'create_savings_plan'
  | 'find_alternatives'
  | 'draft_cancellation'
  | 'retrieve_structured_memory'
  | 'retrieve_semantic_memory'
  | 'persist_memory'
  | 'check_gmail_connection'
  | 'import_gmail_finance'
  | 'build_dashboard_snapshot'
  | 'generate_proactive_insights'
  | 'analyze_error'
  | 'suggest_fix';

export type PlanStepV8 = {
  id: string;
  title: string;
  tool: ToolNameV8;
  description: string;
  input: Record<string, unknown>;
  required: boolean;
};

export type ExecutionPlanV8 = {
  intent: AgentIntentV8;
  subtype: FinanceIntentSubtypeV8;
  mode: AgentModeV8;
  planModes: PlanModeV8[];
  summary: string;
  depth: AgentRouteDepthV8;
  clarificationQuestion?: string;
  steps: PlanStepV8[];
};

export type ToolResultV8 = {
  ok: boolean;
  tool: ToolNameV8;
  output: Record<string, unknown>;
  error?: string;
};

export type ExecutionStepResultV8 = {
  stepId: string;
  title: string;
  tool: ToolNameV8;
  status: 'completed' | 'failed' | 'skipped';
  summary: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error?: string;
};

export type ExecutionResultV8 = {
  steps: ExecutionStepResultV8[];
  structuredData: Record<string, unknown>;
  partialSuccess: boolean;
};

export type SuggestedActionV8 = {
  id: string;
  label: string;
  kind: 'finance' | 'gmail' | 'productivity' | 'general' | 'premium';
  payload?: Record<string, unknown>;
};

export type OperatorModuleV8 = {
  id: string;
  title: 'Best Next Action' | 'Fastest Saving Opportunity' | 'Risk To Watch' | 'What I Need From You' | 'Recommended This Week';
  summary: string;
  impactLabel?: string;
  recommendationId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
};

export type SystemStateV8 = 'idle' | 'understanding' | 'planning' | 'executing' | 'responding';

export type CriticResultV8 = {
  criticScore: number;
  passed: boolean;
  needsRewrite: boolean;
  qualityNotes: string[];
  refinedReply: string;
};

export type AgentResponseV8 = {
  reply: string;
  metadata: {
    intent: AgentIntentV8;
    subtype: FinanceIntentSubtypeV8;
    mode: AgentModeV8;
    responseMode: ResponseModeV8;
    goal: GoalUnderstandingV8;
    plan: string;
    planModes: PlanModeV8[];
    steps: ExecutionStepResultV8[];
    structuredData: Record<string, unknown>;
    suggestedActions: SuggestedActionV8[];
    operatorModules?: OperatorModuleV8[];
    memoryUsed: boolean;
    verificationPassed: boolean;
    critic: Omit<CriticResultV8, 'refinedReply'>;
    state: SystemStateV8;
  };
};

export type AgentRunInputV8 = {
  supabase: SupabaseClient;
  input: string;
  userId: string;
  history?: unknown[];
  memory?: MemoryEnvelopeV8 | null;
  operatorAlerts?: OperatorAlertRecord[];
  outcomes?: RecommendationOutcomeRecord[];
  userProfileIntelligence?: UserProfileIntelligence | null;
  productState: ProductStateV8;
};

export type AgentCriticInputV8 = {
  userMessage: string;
  intent: AgentIntentV8;
  reply: string;
  usedTools: ToolNameV8[];
  plan: ExecutionPlanV8;
  structuredData?: Record<string, unknown>;
  responseLanguage?: string;
  responseMode?: ResponseModeV8;
  goal?: GoalUnderstandingV8;
};
