import { createClient as createSessionSupabase } from '@/lib/supabase/server';
import { createSupabaseServerAdmin } from '@/lib/supabase-server';
import { getUserBillingProfile } from '@/lib/billing-supabase';
import type { PlanId } from '@/lib/plans';

export type CreditTransactionStatus = 'reserved' | 'charged' | 'refunded' | 'failed';
export type CreditHistoryItem = { id: string; title: string; amount: number; reason: string; status: CreditTransactionStatus; createdAt: string };
export type CreditEstimateInput = {
  message?: string;
  intent?: string;
  mode?: 'fast' | 'agent';
  model?: string;
  provider?: 'groq' | 'openai';
  tools?: string[];
  hasFile?: boolean;
  fileCount?: number;
  hasImage?: boolean;
  imageCount?: number;
  usesWeb?: boolean;
  executionSteps?: number;
  reasoningDepth?: 'quick' | 'standard' | 'deep' | 'expert';
};
export type CreditEstimate = {
  estimated: number;
  breakdown: {
    base: number;
    message: number;
    tools: number;
    execution: number;
    reasoning: number;
    model: number;
    media: number;
  };
  title: string;
  reason: string;
  requiresConfirmation: boolean;
};
export type ReserveCreditsResult =
  | { ok: true; reservationId: string; estimate: CreditEstimate; remainingCredits: number }
  | { ok: false; code: 'no_credits'; credits: number; required: number; estimate: CreditEstimate };

type CreditAccountRow = {
  user_id: string;
  plan: PlanId;
  credits_balance: number;
  monthly_credits: number;
  free_credits: number;
  monthly_cycle_id: string;
  daily_cycle_id: string;
  monthly_used: number;
};

type PlanAllowance = {
  daily: number;
  monthlyBonus: number;
};

const PLAN_ALLOWANCE: Record<PlanId, PlanAllowance> = {
  free: { daily: 80, monthlyBonus: 600 },
  plus: { daily: 300, monthlyBonus: 5000 },
  pro: { daily: 800, monthlyBonus: 12000 },
};

const TOOL_COSTS: Record<string, number> = {
  calendar: 2,
  'calendar.today': 2,
  'calendar.search': 2,
  tasks: 2,
  planner: 2,
  'tasks/planner': 2,
  'memory.write': 2,
  'memory.search': 1,
  memory: 1,
  web: 3,
  web_search: 3,
  finance: 4,
  image: 4,
  'image.analysis': 4,
  file: 5,
  pdf: 5,
  workflow: 3,
};

const monthId = (date = new Date(), timeZone?: string) => {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timeZone || 'UTC', year: 'numeric', month: '2-digit' });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? String(date.getUTCFullYear());
  const month = parts.find((part) => part.type === 'month')?.value ?? String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const dayId = (date = new Date(), timeZone?: string) => {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timeZone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' });
  return formatter.format(date);
};

function summarizeTitle(input: CreditEstimateInput) {
  if (input.intent) return `${input.intent.slice(0, 1).toUpperCase()}${input.intent.slice(1)} task`;
  return input.mode === 'agent' ? 'Agent task' : 'Quick chat';
}

function buildDefaultCreditAccount(userId: string, plan: PlanId = 'free', timeZone?: string): CreditAccountRow {
  const allowance = PLAN_ALLOWANCE[plan] ?? PLAN_ALLOWANCE.free;
  return {
    user_id: userId,
    plan,
    credits_balance: allowance.daily + allowance.monthlyBonus,
    monthly_credits: allowance.monthlyBonus,
    free_credits: allowance.daily,
    monthly_cycle_id: monthId(new Date(), timeZone),
    daily_cycle_id: dayId(new Date(), timeZone),
    monthly_used: 0,
  };
}

function normalizeCreditAccount(userId: string, row: any, fallbackPlan: PlanId = 'free', timeZone?: string): CreditAccountRow {
  const fallback = buildDefaultCreditAccount(userId, fallbackPlan, timeZone);
  return {
    user_id: typeof row?.user_id === 'string' ? row.user_id : fallback.user_id,
    plan: (row?.plan as PlanId) || fallback.plan,
    credits_balance: Number(row?.credits_balance ?? fallback.credits_balance),
    monthly_credits: Number(row?.monthly_credits ?? fallback.monthly_credits),
    free_credits: Number(row?.free_credits ?? fallback.free_credits),
    monthly_cycle_id: typeof row?.monthly_cycle_id === 'string' ? row.monthly_cycle_id : fallback.monthly_cycle_id,
    daily_cycle_id: typeof row?.daily_cycle_id === 'string' ? row.daily_cycle_id : fallback.daily_cycle_id,
    monthly_used: Number(row?.monthly_used ?? fallback.monthly_used),
  };
}

function clampCharge(total: number) {
  return Math.max(1, Math.min(18, total));
}

function normalizeToolName(name: string) {
  return name.toLowerCase().replace(/\s+/g, '').replace(/[-_]/g, '.');
}

function scoreTools(input: CreditEstimateInput): number {
  const tools = input.tools ?? [];
  return tools.reduce((sum, raw) => {
    const normalized = normalizeToolName(raw);
    const direct = TOOL_COSTS[normalized];
    if (typeof direct === 'number') return sum + direct;
    if (normalized.includes('calendar')) return sum + 2;
    if (normalized.includes('task') || normalized.includes('plan')) return sum + 2;
    if (normalized.includes('memory.write')) return sum + 2;
    if (normalized.includes('memory')) return sum + 1;
    if (normalized.includes('web')) return sum + 3;
    if (normalized.includes('finance')) return sum + 4;
    if (normalized.includes('image')) return sum + 4;
    if (normalized.includes('file') || normalized.includes('pdf')) return sum + 5;
    return sum + 3;
  }, 0);
}

function scoreExecution(steps: number): number {
  if (steps >= 9) return 6;
  if (steps >= 6) return 4;
  if (steps >= 3) return 2;
  return 0;
}

function scoreReasoning(depth: CreditEstimateInput['reasoningDepth']): number {
  if (depth === 'expert') return 5;
  if (depth === 'deep') return 3;
  if (depth === 'standard') return 1;
  return 0;
}

function scoreModel(provider?: 'groq' | 'openai', model?: string): number {
  const normalized = (model || '').toLowerCase();
  if (provider === 'groq' && normalized.includes('llama-3.3-70b-versatile')) return 0;
  if (normalized.includes('gpt-5') || normalized.includes('sonnet') || normalized.includes('opus')) return 4;
  if (normalized.includes('mini') || normalized.includes('haiku')) return 2;
  return provider === 'groq' ? 0 : 2;
}

function scoreMedia(input: CreditEstimateInput): number {
  const imageCount = Math.max(0, Number(input.imageCount || 0));
  const fileCount = Math.max(0, Number(input.fileCount || 0));
  if (fileCount > 1) return 8;
  if (fileCount === 1 || input.hasFile) return 5;
  if (imageCount > 1) return 6;
  if (imageCount === 1 || input.hasImage) return 4;
  return 0;
}

export function estimateCreditCost(input: CreditEstimateInput): CreditEstimate {
  const text = (input.message || '').trim();
  const words = text ? text.split(/\s+/).length : 0;
  const base = input.mode === 'agent' ? 2 : 1;
  const tools = scoreTools(input) + (input.usesWeb ? 3 : 0);
  const execution = scoreExecution(Math.max(0, Number(input.executionSteps || 0)));
  const reasoning = scoreReasoning(input.reasoningDepth || (input.mode === 'agent' ? 'standard' : 'quick'));
  const model = scoreModel(input.provider, input.model);
  const media = scoreMedia(input);
  const message = words > 220 ? 1 : 0;
  const estimated = clampCharge(base + tools + execution + reasoning + model + media + message);

  return {
    estimated,
    breakdown: { base, message, tools, execution, reasoning, model, media },
    title: summarizeTitle(input),
    reason: `base:${base},tools:${tools},execution:${execution},reasoning:${reasoning},model:${model},media:${media}`,
    requiresConfirmation: estimated >= 8,
  };
}

async function getCurrentUserId() {
  const supabase = await createSessionSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function ensureCreditAccount(userId: string, timeZone?: string): Promise<CreditAccountRow> {
  const admin = createSupabaseServerAdmin();
  const profile = await getUserBillingProfile(userId).catch(() => ({ plan: 'free' as PlanId }));
  const plan = (profile.plan as PlanId) || 'free';
  const fallback = buildDefaultCreditAccount(userId, plan, timeZone);

  const { data: existing, error: readError } = await admin.from('user_credits').select('*').eq('user_id', userId).maybeSingle();
  if (readError) console.error('Failed to read user credit account', { userId, error: readError.message });

  if (!existing) {
    const { data: inserted, error: insertError } = await admin
      .from('user_credits')
      .upsert(
        {
          user_id: userId,
          plan,
          credits_balance: fallback.credits_balance,
          monthly_credits: fallback.monthly_credits,
          free_credits: fallback.free_credits,
          monthly_cycle_id: fallback.monthly_cycle_id,
          daily_cycle_id: fallback.daily_cycle_id,
          monthly_used: 0,
        },
        { onConflict: 'user_id' },
      )
      .select('*')
      .maybeSingle();

    if (insertError) {
      console.error('Failed to initialize user credit account', { userId, error: insertError.message });
    }

    if (inserted) return normalizeCreditAccount(userId, inserted, plan, timeZone);
  }

  await refreshCreditCycles(userId, timeZone);

  const { data: row, error: finalReadError } = await admin.from('user_credits').select('*').eq('user_id', userId).maybeSingle();
  if (finalReadError) console.error('Failed to read initialized user credit account', { userId, error: finalReadError.message });

  return normalizeCreditAccount(userId, row || existing || fallback, plan, timeZone);
}

export async function getCreditBalance(userId?: string, timeZone?: string) {
  const resolvedUserId = userId ?? (await getCurrentUserId());
  if (!resolvedUserId) return { userId: null, credits: 0, plan: 'free' as PlanId, monthlyCredits: 0, freeCredits: 0, monthlyUsed: 0 };
  const account = await ensureCreditAccount(resolvedUserId, timeZone);
  return {
    userId: resolvedUserId,
    credits: Number(account.credits_balance ?? 0),
    plan: (account.plan as PlanId) ?? 'free',
    monthlyCredits: Number(account.monthly_credits ?? 0),
    freeCredits: Number(account.free_credits ?? 0),
    monthlyUsed: Number(account.monthly_used ?? 0),
    monthlyCycleId: account.monthly_cycle_id,
    dailyCycleId: account.daily_cycle_id,
  };
}

export async function refreshCreditCycles(userId: string, timeZone?: string) {
  const admin = createSupabaseServerAdmin();
  const currentMonth = monthId(new Date(), timeZone);
  const currentDay = dayId(new Date(), timeZone);
  const { data: account, error } = await admin.from('user_credits').select('*').eq('user_id', userId).maybeSingle();
  if (error) console.error('Failed to refresh-read credit account', { userId, error: error.message });
  if (!account) return;

  const plan = (account.plan as PlanId) || 'free';
  const allowance = PLAN_ALLOWANCE[plan] ?? PLAN_ALLOWANCE.free;

  let nextBalance = Number(account.credits_balance ?? 0);
  let nextMonthlyCredits = Number(account.monthly_credits ?? 0);
  let nextFreeCredits = Number(account.free_credits ?? 0);
  let nextMonthlyCycle = account.monthly_cycle_id;
  let nextDailyCycle = account.daily_cycle_id;
  let shouldUpdate = false;

  if (account.monthly_cycle_id !== currentMonth) {
    nextBalance += allowance.monthlyBonus;
    nextMonthlyCredits = allowance.monthlyBonus;
    nextMonthlyCycle = currentMonth;
    shouldUpdate = true;

    await admin.from('credit_transactions').insert({
      user_id: userId,
      title: `${plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Plus'} monthly bonus`,
      amount: allowance.monthlyBonus,
      reason: 'Monthly bonus credits refresh',
      agent_tool: 'system',
      status: 'charged',
      balance_after: nextBalance,
    });
  }

  if (account.daily_cycle_id !== currentDay) {
    nextBalance += allowance.daily;
    nextFreeCredits = allowance.daily;
    nextDailyCycle = currentDay;
    shouldUpdate = true;

    await admin.from('credit_transactions').insert({
      user_id: userId,
      title: `${plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Plus'} daily credits`,
      amount: allowance.daily,
      reason: 'Daily credit refresh',
      agent_tool: 'system',
      status: 'charged',
      balance_after: nextBalance,
    });
  }

  if (!shouldUpdate) return;

  const { error: updateError } = await admin
    .from('user_credits')
    .update({
      credits_balance: nextBalance,
      monthly_credits: nextMonthlyCredits,
      free_credits: nextFreeCredits,
      monthly_cycle_id: nextMonthlyCycle,
      daily_cycle_id: nextDailyCycle,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) console.error('Failed to refresh credit cycles', { userId, error: updateError.message });
}

export async function reserveCredits(userId: string, estimate: CreditEstimate, metadata?: { provider?: string; model?: string; costTier?: string; routingReason?: string; fallbackUsed?: boolean }): Promise<ReserveCreditsResult> {
  const admin = createSupabaseServerAdmin();
  const account = await ensureCreditAccount(userId);
  const available = Number(account.credits_balance ?? 0);
  if (available < estimate.estimated) return { ok: false, code: 'no_credits', credits: available, required: estimate.estimated, estimate };
  const reasonWithRoute = metadata ? `${estimate.reason};provider:${metadata.provider || 'unknown'};model:${metadata.model || 'unknown'};costTier:${metadata.costTier || 'low'};fallback:${metadata.fallbackUsed ? 'yes' : 'no'};routing:${metadata.routingReason || 'default'}` : estimate.reason;

  const { data: reservation, error: reservationError } = await admin.from('credit_reservations').insert({ user_id: userId, reserved_amount: estimate.estimated, title: estimate.title, reason: reasonWithRoute, status: 'reserved', expires_at: new Date(Date.now() + 1000 * 60 * 20).toISOString() }).select('id').maybeSingle();
  if (reservationError || !reservation?.id) {
    console.error('Failed to reserve credits', { userId, error: reservationError?.message });
    return { ok: false, code: 'no_credits', credits: available, required: estimate.estimated, estimate };
  }
  await admin.from('user_credits').update({ credits_balance: available - estimate.estimated, updated_at: new Date().toISOString() }).eq('user_id', userId);
  await admin.from('credit_transactions').insert({ user_id: userId, reservation_id: reservation.id, title: estimate.title, amount: -estimate.estimated, reason: reasonWithRoute, agent_tool: 'agent', status: 'reserved', balance_after: available - estimate.estimated });
  return { ok: true, reservationId: reservation.id, estimate, remainingCredits: available - estimate.estimated };
}

export async function finalizeCreditCharge(reservationId: string, actualUsage: { used: number; title?: string; reason?: string; agentTool?: string; failed?: boolean }) {
  const admin = createSupabaseServerAdmin();
  const { data: reservation } = await admin.from('credit_reservations').select('*').eq('id', reservationId).maybeSingle();
  if (!reservation || reservation.status !== 'reserved') return { ok: false as const, code: 'invalid_reservation' };
  const reserved = Number(reservation.reserved_amount ?? 0);
  const used = Math.max(0, Math.min(reserved, Math.ceil(actualUsage.used)));
  const refundAmount = Math.max(0, reserved - used);
  const account = await ensureCreditAccount(reservation.user_id);
  const adjustedBalance = Number(account.credits_balance ?? 0) + refundAmount;

  await admin.from('credit_reservations').update({ actual_amount: used, status: actualUsage.failed ? 'failed' : 'charged', finalized_at: new Date().toISOString() }).eq('id', reservationId);
  await admin.from('credit_transactions').update({ status: actualUsage.failed ? 'failed' : 'charged', title: actualUsage.title || reservation.title, reason: actualUsage.reason || reservation.reason, agent_tool: actualUsage.agentTool || 'agent' }).eq('reservation_id', reservationId).eq('status', 'reserved');
  await admin.from('user_credits').update({ credits_balance: adjustedBalance, monthly_used: Number(account.monthly_used ?? 0) + used, free_credits: Math.max(0, Number(account.free_credits ?? 0) - used), monthly_credits: Math.max(0, Number(account.monthly_credits ?? 0) - used), updated_at: new Date().toISOString() }).eq('user_id', reservation.user_id);

  if (refundAmount > 0) {
    await admin.from('credit_transactions').insert({ user_id: reservation.user_id, reservation_id: reservation.id, title: actualUsage.failed ? 'Partial refund after failed task' : 'Unused reserved credits refunded', amount: refundAmount, reason: actualUsage.reason || (actualUsage.failed ? 'Task failed' : 'Task used less than estimate'), agent_tool: actualUsage.agentTool || 'agent', status: 'refunded', balance_after: adjustedBalance });
  }
  return { ok: true as const, charged: used, refunded: refundAmount };
}

export async function refundCredits(userId: string, amount: number, reason: string, title = 'Credit reward') {
  const admin = createSupabaseServerAdmin();
  const account = await ensureCreditAccount(userId);
  const safeAmount = Math.max(0, Math.ceil(amount));
  const nextBalance = Number(account.credits_balance ?? 0) + safeAmount;
  await admin.from('user_credits').update({ credits_balance: nextBalance, updated_at: new Date().toISOString() }).eq('user_id', userId);
  await admin.from('credit_transactions').insert({ user_id: userId, title, amount: safeAmount, reason, agent_tool: 'system', status: 'refunded', balance_after: nextBalance });
  return { ok: true as const, balance: nextBalance };
}

export async function getCreditHistory(userId: string, input?: { page?: number; pageSize?: number }): Promise<CreditHistoryItem[]> {
  const admin = createSupabaseServerAdmin();
  const page = Math.max(1, Number(input?.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(input?.pageSize ?? 30)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data } = await admin
    .from('credit_transactions')
    .select('id,title,amount,reason,created_at,status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  return (data || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    amount: Number(item.amount ?? 0),
    reason: item.reason || '',
    status: (item.status as CreditTransactionStatus) || 'charged',
    createdAt: item.created_at,
  }));
}

export async function applyCreditReward(userId: string, reward: 'streak_7' | 'beta_tester' | 'invite_friend') {
  if (reward === 'streak_7') return refundCredits(userId, 50, '7 day streak', '7-day streak reward');
  if (reward === 'beta_tester') return refundCredits(userId, 200, 'Beta tester reward', 'Beta tester reward');
  return refundCredits(userId, 100, 'Invite friend reward', 'Referral reward');
}
