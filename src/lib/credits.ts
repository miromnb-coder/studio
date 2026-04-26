import type { PlanId } from './plans';

export type CreditAction =
  | 'chat.fast'
  | 'chat.agent'
  | 'memory.search'
  | 'calendar.check'
  | 'gmail.scan'
  | 'file.analyze'
  | 'web.research'
  | 'daily.refresh'
  | 'monthly.refresh'
  | 'stripe.purchase'
  | 'manual.grant';

export type CreditLedgerItem = {
  id: string;
  createdAt: string;
  title: string;
  action: CreditAction;
  amount: number;
  balanceAfter: number;
  metadata?: Record<string, unknown>;
};

export type CreditAccount = {
  userId: string;
  plan: PlanId;
  credits: number;
  dailyRefreshCredits: number;
  monthlyCredits: number;
  monthlyUsed: number;
  lastDailyRefresh: string;
  currentMonth: string;
  history: CreditLedgerItem[];
};

export type CreditEstimate = {
  action: CreditAction;
  cost: number;
  title: string;
  reason: string;
  tier: 'tiny' | 'small' | 'normal' | 'heavy' | 'deep';
};

export type CreditChargeResult =
  | { ok: true; account: CreditAccount; estimate?: CreditEstimate }
  | { ok: false; account: CreditAccount; error: 'not_enough_credits'; required: number; available: number; estimate?: CreditEstimate };

const FREE_DAILY_CREDITS = 100;
const PLUS_MONTHLY_CREDITS = 3000;
const PRO_MONTHLY_CREDITS = 8000;
const MAX_HISTORY = 80;

declare global {
  // eslint-disable-next-line no-var
  var __kivoCreditsStore: Map<string, CreditAccount> | undefined;
}

function getStore() {
  if (!globalThis.__kivoCreditsStore) globalThis.__kivoCreditsStore = new Map();
  return globalThis.__kivoCreditsStore;
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function makeId() {
  return `cr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizePlan(plan?: PlanId | null): PlanId {
  return plan === 'plus' || plan === 'pro' ? plan : 'free';
}

function pushHistory(account: CreditAccount, item: Omit<CreditLedgerItem, 'id' | 'createdAt'>): CreditAccount {
  return {
    ...account,
    history: [
      { id: makeId(), createdAt: new Date().toISOString(), ...item },
      ...account.history,
    ].slice(0, MAX_HISTORY),
  };
}

export function getPlanCreditAllowance(plan: PlanId) {
  if (plan === 'pro') return { dailyRefreshCredits: 0, monthlyCredits: PRO_MONTHLY_CREDITS };
  if (plan === 'plus') return { dailyRefreshCredits: 0, monthlyCredits: PLUS_MONTHLY_CREDITS };
  return { dailyRefreshCredits: FREE_DAILY_CREDITS, monthlyCredits: 0 };
}

export function createDefaultCreditAccount(userId: string, plan: PlanId = 'free'): CreditAccount {
  const resolvedPlan = normalizePlan(plan);
  const allowance = getPlanCreditAllowance(resolvedPlan);
  const initialCredits = resolvedPlan === 'free' ? allowance.dailyRefreshCredits : allowance.monthlyCredits;
  return {
    userId,
    plan: resolvedPlan,
    credits: initialCredits,
    dailyRefreshCredits: allowance.dailyRefreshCredits,
    monthlyCredits: allowance.monthlyCredits,
    monthlyUsed: 0,
    lastDailyRefresh: todayKey(),
    currentMonth: monthKey(),
    history: [
      {
        id: makeId(),
        createdAt: new Date().toISOString(),
        title: resolvedPlan === 'free' ? 'Daily refresh credits' : `${resolvedPlan === 'pro' ? 'Pro' : 'Plus'} monthly credits`,
        action: resolvedPlan === 'free' ? 'daily.refresh' : 'monthly.refresh',
        amount: initialCredits,
        balanceAfter: initialCredits,
      },
    ],
  };
}

export function syncPlan(account: CreditAccount, plan: PlanId): CreditAccount {
  const resolvedPlan = normalizePlan(plan);
  if (account.plan === resolvedPlan) return account;
  const allowance = getPlanCreditAllowance(resolvedPlan);
  const added = resolvedPlan === 'free' ? allowance.dailyRefreshCredits : allowance.monthlyCredits;
  const next: CreditAccount = {
    ...account,
    plan: resolvedPlan,
    credits: Math.max(account.credits, added),
    dailyRefreshCredits: allowance.dailyRefreshCredits,
    monthlyCredits: allowance.monthlyCredits,
    monthlyUsed: 0,
    currentMonth: monthKey(),
  };
  return pushHistory(next, {
    title: `${resolvedPlan === 'free' ? 'Free' : resolvedPlan === 'pro' ? 'Pro' : 'Plus'} plan activated`,
    action: resolvedPlan === 'free' ? 'daily.refresh' : 'monthly.refresh',
    amount: Math.max(0, next.credits - account.credits),
    balanceAfter: next.credits,
  });
}

export function applyRefreshes(account: CreditAccount): CreditAccount {
  let next = account;
  const currentDay = todayKey();
  const currentMonth = monthKey();

  if (next.plan === 'free' && next.lastDailyRefresh !== currentDay) {
    const allowance = getPlanCreditAllowance('free');
    const before = next.credits;
    next = {
      ...next,
      credits: Math.max(next.credits, allowance.dailyRefreshCredits),
      dailyRefreshCredits: allowance.dailyRefreshCredits,
      lastDailyRefresh: currentDay,
    };
    next = pushHistory(next, {
      title: 'Daily refresh credits',
      action: 'daily.refresh',
      amount: Math.max(0, next.credits - before),
      balanceAfter: next.credits,
    });
  }

  if (next.plan !== 'free' && next.currentMonth !== currentMonth) {
    const allowance = getPlanCreditAllowance(next.plan);
    next = {
      ...next,
      credits: allowance.monthlyCredits,
      monthlyCredits: allowance.monthlyCredits,
      monthlyUsed: 0,
      currentMonth,
    };
    next = pushHistory(next, {
      title: `${next.plan === 'pro' ? 'Pro' : 'Plus'} monthly credits`,
      action: 'monthly.refresh',
      amount: allowance.monthlyCredits,
      balanceAfter: next.credits,
    });
  }

  return next;
}

export function estimateCreditCost(input: { message?: string; mode?: 'fast' | 'agent'; hasFile?: boolean; usesWeb?: boolean }): CreditEstimate {
  const text = (input.message || '').toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;
  let cost = input.mode === 'agent' ? 8 : 2;
  let action: CreditAction = input.mode === 'agent' ? 'chat.agent' : 'chat.fast';
  let title = input.mode === 'agent' ? 'Agent task' : 'Chat message';
  const reasons: string[] = [input.mode === 'agent' ? 'agent mode' : 'fast mode'];

  if (words > 80) { cost += 2; reasons.push('longer request'); }
  if (words > 180) { cost += 4; reasons.push('large context'); }
  if (/gmail|email|sähköposti|inbox/.test(text)) { cost += 5; action = 'gmail.scan'; title = 'Gmail scan'; reasons.push('Gmail context'); }
  if (/calendar|kalenteri|schedule|today|tänään|päivä/.test(text)) { cost += 3; action = 'calendar.check'; title = 'Calendar check'; reasons.push('calendar context'); }
  if (/memory|remember|muista|previous|aiemmin/.test(text)) { cost += 2; action = 'memory.search'; title = 'Memory search'; reasons.push('memory context'); }
  if (/research|latest|etsi|selvitä|web|internet|vertaa|analysoi/.test(text) || input.usesWeb) { cost += 8; action = 'web.research'; title = 'Research task'; reasons.push('web/research'); }
  if (input.hasFile) { cost += 6; action = 'file.analyze'; title = 'File analysis'; reasons.push('file input'); }

  const tier = cost <= 2 ? 'tiny' : cost <= 5 ? 'small' : cost <= 10 ? 'normal' : cost <= 18 ? 'heavy' : 'deep';
  return { action, cost: Math.max(1, cost), title, reason: reasons.join(', '), tier };
}

export function readCreditAccount(userId = 'local-user', plan: PlanId = 'free') {
  const store = getStore();
  const existing = store.get(userId);
  const account = applyRefreshes(syncPlan(existing || createDefaultCreditAccount(userId, plan), plan));
  store.set(userId, account);
  return account;
}

export function chargeCredits(input: { userId?: string; plan?: PlanId; amount: number; action: CreditAction; title: string; estimate?: CreditEstimate; metadata?: Record<string, unknown> }): CreditChargeResult {
  const userId = input.userId || 'local-user';
  const plan = normalizePlan(input.plan || 'free');
  const store = getStore();
  const account = readCreditAccount(userId, plan);

  if (account.credits < input.amount) {
    return { ok: false, account, error: 'not_enough_credits', required: input.amount, available: account.credits, estimate: input.estimate };
  }

  const nextBalance = account.credits - input.amount;
  const next = pushHistory({ ...account, credits: nextBalance, monthlyUsed: account.monthlyUsed + input.amount }, {
    title: input.title,
    action: input.action,
    amount: -input.amount,
    balanceAfter: nextBalance,
    metadata: { ...(input.metadata || {}), estimate: input.estimate },
  });
  store.set(userId, next);
  return { ok: true, account: next, estimate: input.estimate };
}

export function chargeEstimatedCredits(input: { userId?: string; plan?: PlanId; message?: string; mode?: 'fast' | 'agent'; hasFile?: boolean; usesWeb?: boolean }) {
  const estimate = estimateCreditCost(input);
  return chargeCredits({ userId: input.userId, plan: input.plan, amount: estimate.cost, action: estimate.action, title: estimate.title, estimate });
}

export function grantCredits(input: { userId?: string; plan?: PlanId; amount: number; title?: string; action?: CreditAction; metadata?: Record<string, unknown> }) {
  const userId = input.userId || 'local-user';
  const account = readCreditAccount(userId, input.plan || 'free');
  const nextBalance = account.credits + input.amount;
  const next = pushHistory({ ...account, credits: nextBalance }, {
    title: input.title || 'Credits added',
    action: input.action || 'manual.grant',
    amount: input.amount,
    balanceAfter: nextBalance,
    metadata: input.metadata,
  });
  getStore().set(userId, next);
  return next;
}

export function getCreditSnapshot(input?: { userId?: string; plan?: PlanId }) {
  const account = readCreditAccount(input?.userId || 'local-user', input?.plan || 'free');
  return {
    ...account,
    allowance: getPlanCreditAllowance(account.plan),
    nextRefreshType: account.plan === 'free' ? 'daily' : 'monthly',
  };
}
