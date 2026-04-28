import type { KernelPlannerIntent, KernelReasoningDepth } from './planner';

export type ModelRouterProvider = 'groq' | 'openai';
export type ModelRouterCostTier = 'low' | 'medium' | 'high';

export type ModelRouterInput = {
  message: string;
  intent: KernelPlannerIntent;
  taskDepth: 'quick' | 'standard' | 'deep';
  reasoningDepth?: KernelReasoningDepth;
  needsTools: boolean;
  requiresHighAccuracy: boolean;
  isRepairPass: boolean;
};

export type ModelRouterOutput = {
  provider: ModelRouterProvider;
  model: string;
  costTier: ModelRouterCostTier;
  reason: string;
  fallbackProvider: ModelRouterProvider;
};

const HIGH_RISK_INTENTS: KernelPlannerIntent[] = ['finance', 'research'];
const HIGH_RISK_PATTERNS = [
  /medical/i,
  /legal/i,
  /lawsuit/i,
  /prescription/i,
  /diagnos/i,
  /tax/i,
  /compliance/i,
  /contract/i,
  /security/i,
  /incident/i,
];

function isHighRiskTask(message: string, intent: KernelPlannerIntent): boolean {
  if (HIGH_RISK_INTENTS.includes(intent)) return true;
  return HIGH_RISK_PATTERNS.some((pattern) => pattern.test(message));
}

function groqDefaultModel(): string {
  return process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';
}

function openAIDefaultModel(): string {
  return process.env.OPENAI_MODEL ?? 'gpt-5.4-mini';
}

export function routeKernelModel(input: ModelRouterInput): ModelRouterOutput {
  const highRisk = isHighRiskTask(input.message, input.intent);

  if (input.isRepairPass) {
    return {
      provider: 'openai',
      model: openAIDefaultModel(),
      costTier: 'high',
      reason: 'Repair pass requires highest reliability and post-check quality control.',
      fallbackProvider: 'groq',
    };
  }

  if (input.reasoningDepth === 'expert') {
    return {
      provider: 'openai',
      model: openAIDefaultModel(),
      costTier: 'high',
      reason: 'Expert reasoning requested; route to highest-reliability model path.',
      fallbackProvider: 'groq',
    };
  }

  if (input.requiresHighAccuracy || highRisk) {
    return {
      provider: 'openai',
      model: openAIDefaultModel(),
      costTier: 'high',
      reason: input.requiresHighAccuracy
        ? 'Task flagged for high accuracy and routed to OpenAI only as necessary fallback.'
        : 'High-risk task detected; routing to OpenAI fallback for safer output quality.',
      fallbackProvider: 'groq',
    };
  }
  if (input.taskDepth === 'quick' && !input.needsTools) {
    return {
      provider: 'groq',
      model: groqDefaultModel(),
      costTier: 'low',
      reason: 'Quick/simple task routed to Groq to minimize cost and latency.',
      fallbackProvider: 'openai',
    };
  }

  return {
    provider: 'groq',
    model: groqDefaultModel(),
    costTier: input.needsTools ? 'medium' : 'low',
    reason: input.needsTools
      ? 'Normal task with tools routed to Groq as default cost-efficient provider.'
      : 'Normal task routed to Groq as default provider.',
    fallbackProvider: 'openai',
  };
}
