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
  | 'manual.grant';

export type CreditLedgerItem = {
  id: string;
  createdAt: string;
  title: string;
  action: CreditAction;
  amount: number;
  balanceAfter: number;
};

export type CreditAccount = {
  userId: string;
  plan: PlanId;
  credits: number;
  dailyRefreshCredits: number;
  monthlyCredits: number;
  monthlyUsed: number;
  lastDailyRefresh: string;
  history: CreditLedgerItem[];
};

export type CreditEstimate = {
  action: CreditAction;
  cost: number;
  title: string;
  reason: string;
};

const FREE_DAILY_CREDITS = 100;
const PLUS_MONTHLY_CREDITS = 3000;
const PRO_MONTHLY_CREDITS = 8000;
const MAX_HISTORY = 60;

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

function makeId() {
  return `cr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getPlanCreditAllowance(plan: PlanId) {
  if (plan === 'pro') return { dailyRefreshCredits: 0, monthlyCredits: PRO_MONTHLY_CREDITS };
  if (plan === 'plus') return { dailyRefreshCredits: 0, monthlyCredits: PLUS_MONTHLY_CREDITS };
  return { dailyRefreshCredits: FREE_DAILY_CREDITS, monthlyCredits: 0 };
}

export function createDefaultCreditAccount(userId: string, plan: PlanId = 'free'): CreditAccount {
  const allowance = getPlanCreditAllowance(plan);
  const initialCredits = plan === 'free' ? allowance.dailyRefreshCredits : allowance.monthlyCredits;
  return {
    userId,
    plan,
    credits: initialCredits,
    dailyRefreshCredits: allowance.dailyRefreshCredits,
    monthlyCredits: allowance.monthlyCredits,
    monthlyUsed: 0,
    lastDailyRefresh: todayKey(),
    history: [
      {
        id: makeId(),
        createdAt: new Date().toISOString(),
        title: plan === 'free' ? 'Daily refresh credits' : `${plan === 'pro' ? 'Pro' : 'Plus'} monthly credits`,
        action: plan === 'free' ? 'daily.refresh' : 'manual.grant',
        amount: initialCredits,
        balanceAfter: initialCredits,
      },
    ],
  };
}

export function applyDailyRefresh(account: CreditAccount): CreditAccount {
  if (account.plan !== 'free') return account;
  const currentDay = todayKey();
  if (account.lastDailyRefresh === currentDay) return account;
  const allowance = getPlanCreditAllowance('free');
  const nextCredits = Math.max(account.credits, allowance.dailyRefreshCredits);
  return {
    ...account,
    credits: nextCredits,
    dailyRefreshCredits: allowance.dailyRefreshCredits,
    lastDailyRefresh: currentDay,
    history: [
      {
        id: makeId(),
        createdAt: new Date().toISOString(),
        title: 'Daily refresh credits',
        action: 'daily.refresh',
        amount: allowance.dailyRefreshCredits,
        balanceAfter: nextCredits,
      },
      ...account.history,
    ].slice(0, MAX_HISTORY),
  };
}

export function estimateCreditCost(input: { message?: string; mode?: 'fast' | 'agent'; hasFile?: boolean; usesWeb?: boolean }): CreditEstimate {
  const text = (input.message || '').toLowerCase();
  let cost = input.mode === 'agent' ? 8 : 2;
  let action: CreditAction = input.mode === 'agent' ? 'chat.agent' : 'chat.fast';
  let title = input.mode === 'agent' ? 'Agent task' : 'Chat message';
  const reasons: string[] = [input.mode === 'agent' ? 'agent mode' : 'fast mode'];

  if (/gmail|email|sähköposti|inbox/.test(text)) { cost += 5; action = 'gmail.scan'; title = 'Gmail scan'; reasons.push('Gmail context'); }
  if (/calendar|kalenteri|schedule|today|tänään/.test(text)) { cost += 3; action = 'calendar.check'; title = 'Calendar check'; reasons.push('calendar context'); }
  if (/memory|remember|muista|previous|aiemmin/.test(text)) { cost += 2; action = 'memory.search'; title = 'Memory search'; reasons.push('memory context'); }
  if (/research|latest|etsi|selvitä|web|internet/.test(text) || input.usesWeb) { cost += 8; action = 'web.research'; title = 'Research task'; reasons.push('web/research'); }
  if (input.hasFile) { cost += 6; action = 'file.analyze'; title = 'File analysis'; reasons.push('file input'); }

  return { action, cost: Math.max(1, cost), title, reason: reasons.join(', ') };
}

export function readCreditAccount(userId = 'local-user', plan: PlanId = 'free') {
  const store = getStore();
  const existing = store.get(userId);
  const account = applyDailyRefresh(existing || createDefaultCreditAccount(userId, plan));
  store.set(userId, account);
  return account;
}

export function chargeCredits(input: { userId?: string; plan?: PlanId; amount: number; action: CreditAction; title: string }) {
  const userId = input.userId || 'local-user';
  const plan = input.plan || 'free';
  const store = getStore();
  const account = readCreditAccount(userId, plan);

  if (account.credits < input.amount) {
    return {
      ok: false,
      account,
      error: 'not_enough_credits',
      required: input.amount,
      available: account.credits,
    } as const;
  }

  const nextBalance = account.credits - input.amount;
  const next: CreditAccount = {
    ...account,
    credits: nextBalance,
    monthlyUsed: account.monthlyUsed + input.amount,
    history: [
      {
        id: makeId(),
        createdAt: new Date().toISOString(),
        title: input.title,
        action: input.action,
        amount: -input.amount,
        balanceAfter: nextBalance,
      },
      ...account.history,
    ].slice(0, MAX_HISTORY),
  };
  store.set(userId, next);
  return { ok: true, account: next } as const;
}

export function grantCredits(input: { userId?: string; plan?: PlanId; amount: number; title?: string }) {
  const userId = input.userId || 'local-user';
  const account = readCreditAccount(userId, input.plan || 'free');
  const nextBalance = account.credits + input.amount;
  const next: CreditAccount = {
    ...account,
    credits: nextBalance,
    history: [
      {
        id: makeId(),
        createdAt: new Date().toISOString(),
        title: input.title || 'Credits added',
        action: 'manual.grant',
        amount: input.amount,
        balanceAfter: nextBalance,
      },
      ...account.history,
    ].slice(0, MAX_HISTORY),
  };
  getStore().set(userId, next);
  return next;
}
