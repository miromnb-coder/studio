export type PlanId = 'free' | 'plus' | 'pro';

export type LimitKey =
  | 'messages_month'
  | 'agent_runs_month'
  | 'file_analyses_month'
  | 'automations_max'
  | 'memory_enabled'
  | 'premium_tools_enabled'
  | 'premium_models_enabled';

export type PlanConfig = {
  id: PlanId;
  label: string;
  monthlyPriceEur: number;
  limits: {
    messages_month: number;
    agent_runs_month: number;
    file_analyses_month: number;
    automations_max: number;
    memory_enabled: boolean;
    premium_tools_enabled: boolean;
    premium_models_enabled: boolean;
  };
};

export const PLAN_CONFIG: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    label: 'Free',
    monthlyPriceEur: 0,
    limits: {
      messages_month: 150,
      agent_runs_month: 20,
      file_analyses_month: 10,
      automations_max: 1,
      memory_enabled: false,
      premium_tools_enabled: false,
      premium_models_enabled: false,
    },
  },
  plus: {
    id: 'plus',
    label: 'Plus',
    monthlyPriceEur: 5.99,
    limits: {
      messages_month: 1200,
      agent_runs_month: 250,
      file_analyses_month: 80,
      automations_max: 10,
      memory_enabled: true,
      premium_tools_enabled: true,
      premium_models_enabled: true,
    },
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    monthlyPriceEur: 11.99,
    limits: {
      messages_month: 5000,
      agent_runs_month: 1200,
      file_analyses_month: 300,
      automations_max: 50,
      memory_enabled: true,
      premium_tools_enabled: true,
      premium_models_enabled: true,
    },
  },
};

export function getPlanConfig(plan: PlanId | null | undefined): PlanConfig {
  return PLAN_CONFIG[plan ?? 'free'] ?? PLAN_CONFIG.free;
}
