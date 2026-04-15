import { getPlanConfig, type LimitKey, type PlanId } from './plans';

export type UsageBucket = {
  messages_month: number;
  agent_runs_month: number;
  file_analyses_month: number;
  automations_current: number;
};

export type LimitCheckResult =
  | {
      ok: true;
      plan: PlanId;
      usage: UsageBucket;
      remaining: number | boolean;
    }
  | {
      ok: false;
      plan: PlanId;
      usage: UsageBucket;
      limitKey: LimitKey;
      limitValue: number | boolean;
      currentValue: number;
      upgradeTarget: 'plus' | 'pro';
      message: string;
    };

export const EMPTY_USAGE_BUCKET: UsageBucket = {
  messages_month: 0,
  agent_runs_month: 0,
  file_analyses_month: 0,
  automations_current: 0,
};

export function getUsageMonthId(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getUpgradeTarget(plan: PlanId): 'plus' | 'pro' {
  return plan === 'free' ? 'plus' : 'pro';
}

export function checkNumericLimit(params: {
  plan: PlanId;
  usage: UsageBucket;
  limitKey: Extract<
    LimitKey,
    'messages_month' | 'agent_runs_month' | 'file_analyses_month'
  >;
  nextAmount?: number;
  label: string;
}): LimitCheckResult {
  const { plan, usage, limitKey, nextAmount = 1, label } = params;
  const config = getPlanConfig(plan);
  const limitValue = config.limits[limitKey];
  const currentValue = usage[limitKey];
  const nextValue = currentValue + nextAmount;

  if (nextValue <= limitValue) {
    return {
      ok: true,
      plan,
      usage,
      remaining: Math.max(0, limitValue - nextValue),
    };
  }

  return {
    ok: false,
    plan,
    usage,
    limitKey,
    limitValue,
    currentValue,
    upgradeTarget: getUpgradeTarget(plan),
    message: `${label} limit reached for your ${config.label} plan.`,
  };
}

export function checkBooleanEntitlement(params: {
  plan: PlanId;
  usage: UsageBucket;
  limitKey: Extract<
    LimitKey,
    'memory_enabled' | 'premium_tools_enabled' | 'premium_models_enabled'
  >;
  label: string;
}): LimitCheckResult {
  const { plan, usage, limitKey, label } = params;
  const config = getPlanConfig(plan);
  const enabled = config.limits[limitKey];

  if (enabled) {
    return {
      ok: true,
      plan,
      usage,
      remaining: true,
    };
  }

  return {
    ok: false,
    plan,
    usage,
    limitKey,
    limitValue: false,
    currentValue: 0,
    upgradeTarget: getUpgradeTarget(plan),
    message: `${label} is not available on your ${config.label} plan.`,
  };
}

export function checkAutomationLimit(params: {
  plan: PlanId;
  usage: UsageBucket;
}): LimitCheckResult {
  const { plan, usage } = params;
  const config = getPlanConfig(plan);
  const currentValue = usage.automations_current;
  const limitValue = config.limits.automations_max;

  if (currentValue < limitValue) {
    return {
      ok: true,
      plan,
      usage,
      remaining: Math.max(0, limitValue - (currentValue + 1)),
    };
  }

  return {
    ok: false,
    plan,
    usage,
    limitKey: 'automations_max',
    limitValue,
    currentValue,
    upgradeTarget: getUpgradeTarget(plan),
    message: `Automation limit reached for your ${config.label} plan.`,
  };
}
