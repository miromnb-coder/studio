import { createClient as createSessionSupabase } from '@/lib/supabase/server';
import { createSupabaseServerAdmin } from '@/lib/supabase-server';
import { getUserBillingProfile } from '@/lib/billing-supabase';
import type { PlanId } from '@/lib/plans';

export type CreditTransactionStatus = 'reserved' | 'charged' | 'refunded' | 'failed';
export type CreditHistoryItem = { id: string; title: string; amount: number; reason: string; agentTool: string | null; created_at: string; status: CreditTransactionStatus };
export type CreditEstimateInput = { message?: string; intent?: string; mode?: 'fast' | 'agent'; model?: string; tools?: string[]; hasFile?: boolean; fileCount?: number; hasImage?: boolean; imageCount?: number; memoryReads?: number; usesWeb?: boolean; executionSteps?: number };
export type CreditEstimate = { estimated: number; breakdown: { base: number; message: number; model: number; tools: number; fileImage: number; memory: number; web: number; execution: number; multiplier: number }; title: string; reason: string; requiresConfirmation: boolean };
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
  monthly_used: number;
};

const PLAN_MONTHLY: Record<PlanId, number> = { free: 350, plus: 3200, pro: 8000 };
const monthId = (date = new Date()) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

function summarizeTitle(input: CreditEstimateInput) {
  if (input.intent) return `${input.intent.slice(0, 1).toUpperCase()}${input.intent.slice(1)} task`;
  return input.mode === 'agent' ? 'Agent task' : 'Chat request';
}

function buildDefaultCreditAccount(userId: string, plan: PlanId = 'free'): CreditAccountRow {
  const monthly = PLAN_MONTHLY[plan] ?? PLAN_MONTHLY.free;
  return {
    user_id: userId,
    plan,
    credits_balance: monthly,
    monthly_credits: monthly,
    free_credits: plan === 'free' ? monthly : 0,
    monthly_cycle_id: monthId(),
    monthly_used: 0,
  };
}

function normalizeCreditAccount(userId: string, row: any, fallbackPlan: PlanId = 'free'): CreditAccountRow {
  const fallback = buildDefaultCreditAccount(userId, fallbackPlan);
  return {
    user_id: typeof row?.user_id === 'string' ? row.user_id : fallback.user_id,
    plan: (row?.plan as PlanId) || fallback.plan,
    credits_balance: Number(row?.credits_balance ?? fallback.credits_balance),
    monthly_credits: Number(row?.monthly_credits ?? fallback.monthly_credits),
    free_credits: Number(row?.free_credits ?? fallback.free_credits),
    monthly_cycle_id: typeof row?.monthly_cycle_id === 'string' ? row.monthly_cycle_id : fallback.monthly_cycle_id,
    monthly_used: Number(row?.monthly_used ?? fallback.monthly_used),
  };
}

export function estimateCreditCost(input: CreditEstimateInput): CreditEstimate {
  const text = (input.message || '').trim();
  const words = text ? text.split(/\s+/).length : 0;
  const base = input.mode === 'agent' ? 8 : 2;
  const message = Math.ceil(words / 120);
  const modelName = (input.model || '').toLowerCase();
  const model = modelName.includes('gpt-5') || modelName.includes('sonnet') ? 5 : modelName.includes('mini') ? 1 : 3;
  const tools = Math.max(0, (input.tools?.length || 0) * 2);
  const fileImage = (input.fileCount || 0) * 4 + (input.imageCount || 0) * 5 + (input.hasFile ? 4 : 0) + (input.hasImage ? 5 : 0);
  const memory = Math.max(0, input.memoryReads || 0);
  const web = input.usesWeb ? 8 : 0;
  const execution = Math.max(0, input.executionSteps || (input.mode === 'agent' ? 3 : 1));
  const subtotal = base + message + model + tools + fileImage + memory + web + execution;
  const multiplier = words > 500 || (input.executionSteps || 0) > 12 ? 1.6 : words > 250 || (input.executionSteps || 0) > 7 ? 1.35 : words > 120 || (input.executionSteps || 0) > 4 ? 1.15 : 1;
  const estimated = Math.max(1, Math.ceil(subtotal * multiplier));
  return {
    estimated,
    breakdown: { base, message, model, tools, fileImage, memory, web, execution, multiplier },
    title: summarizeTitle(input),
    reason: `base:${base}, words:${words}, tools:${input.tools?.length || 0}, web:${input.usesWeb ? 'yes' : 'no'}`,
    requiresConfirmation: estimated >= 120,
  };
}

async function getCurrentUserId() {
  const supabase = await createSessionSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function ensureCreditAccount(userId: string): Promise<CreditAccountRow> {
  const admin = createSupabaseServerAdmin();
  const profile = await getUserBillingProfile(userId).catch(() => ({ plan: 'free' as PlanId }));
  const plan = (profile.plan as PlanId) || 'free';
  const currentMonth = monthId();
  const fallback = buildDefaultCreditAccount(userId, plan);

  const { data: existing, error: readError } = await admin.from('user_credits').select('*').eq('user_id', userId).maybeSingle();

  if (readError) {
    console.error('Failed to read user credit account', { userId, error: readError.message });
  }

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
          monthly_cycle_id: currentMonth,
          monthly_used: 0,
        },
        { onConflict: 'user_id' },
      )
      .select('*')
      .maybeSingle();

    if (insertError) {
      console.error('Failed to initialize user credit account', { userId, error: insertError.message });
    }

    if (inserted) return normalizeCreditAccount(userId, inserted, plan);
  }

  await refreshMonthlyCredits(userId);

  const { data: row, error: finalReadError } = await admin.from('user_credits').select('*').eq('user_id', userId).maybeSingle();

  if (finalReadError) {
    console.error('Failed to read initialized user credit account', { userId, error: finalReadError.message });
  }

  return normalizeCreditAccount(userId, row || existing || fallback, plan);
}

export async function getCreditBalance(userId?: string) {
  const resolvedUserId = userId ?? (await getCurrentUserId());
  if (!resolvedUserId) return { userId: null, credits: 0, plan: 'free' as PlanId, monthlyCredits: 0, freeCredits: 0, monthlyUsed: 0 };
  const account = await ensureCreditAccount(resolvedUserId);
  return { userId: resolvedUserId, credits: Number(account.credits_balance ?? 0), plan: (account.plan as PlanId) ?? 'free', monthlyCredits: Number(account.monthly_credits ?? 0), freeCredits: Number(account.free_credits ?? 0), monthlyUsed: Number(account.monthly_used ?? 0), monthlyCycleId: account.monthly_cycle_id };
}

export async function refreshMonthlyCredits(userId: string) {
  const admin = createSupabaseServerAdmin();
  const currentMonth = monthId();
  const { data: account, error } = await admin.from('user_credits').select('*').eq('user_id', userId).maybeSingle();
  if (error) console.error('Failed to refresh-read credit account', { userId, error: error.message });
  if (!account || account.monthly_cycle_id === currentMonth) return;
  const plan = (account.plan as PlanId) || 'free';
  const monthly = PLAN_MONTHLY[plan] ?? PLAN_MONTHLY.free;
  const { data: updated, error: updateError } = await admin.from('user_credits').update({ credits_balance: monthly, monthly_credits: monthly, free_credits: plan === 'free' ? monthly : 0, monthly_used: 0, monthly_cycle_id: currentMonth, updated_at: new Date().toISOString() }).eq('user_id', userId).select('*').maybeSingle();
  if (updateError) console.error('Failed to refresh monthly credits', { userId, error: updateError.message });
  await admin.from('credit_transactions').insert({ user_id: userId, title: `${plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Plus'} monthly credits`, amount: monthly, reason: 'Monthly refresh', agent_tool: 'system', status: 'charged', balance_after: Number(updated?.credits_balance ?? monthly) });
}

export async function reserveCredits(userId: string, estimate: CreditEstimate): Promise<ReserveCreditsResult> {
  const admin = createSupabaseServerAdmin();
  const account = await ensureCreditAccount(userId);
  const available = Number(account.credits_balance ?? 0);
  if (available < estimate.estimated) return { ok: false, code: 'no_credits', credits: available, required: estimate.estimated, estimate };
  const { data: reservation, error: reservationError } = await admin.from('credit_reservations').insert({ user_id: userId, reserved_amount: estimate.estimated, title: estimate.title, reason: estimate.reason, status: 'reserved', expires_at: new Date(Date.now() + 1000 * 60 * 20).toISOString() }).select('id').maybeSingle();
  if (reservationError || !reservation?.id) {
    console.error('Failed to reserve credits', { userId, error: reservationError?.message });
    return { ok: false, code: 'no_credits', credits: available, required: estimate.estimated, estimate };
  }
  await admin.from('user_credits').update({ credits_balance: available - estimate.estimated, updated_at: new Date().toISOString() }).eq('user_id', userId);
  await admin.from('credit_transactions').insert({ user_id: userId, reservation_id: reservation.id, title: estimate.title, amount: -estimate.estimated, reason: estimate.reason, agent_tool: 'agent', status: 'reserved', balance_after: available - estimate.estimated });
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
  await admin.from('credit_transactions').update({ status: actualUsage.failed ? 'failed' : 'charged' }).eq('reservation_id', reservationId).eq('status', 'reserved');
  await admin.from('user_credits').update({ credits_balance: adjustedBalance, monthly_used: Number(account.monthly_used ?? 0) + used, updated_at: new Date().toISOString() }).eq('user_id', reservation.user_id);

  if (refundAmount > 0) {
    await admin.from('credit_transactions').insert({ user_id: reservation.user_id, reservation_id: reservation.id, title: actualUsage.failed ? 'Partial refund after failed task' : 'Unused reserved credits refunded', amount: refundAmount, reason: actualUsage.reason || (actualUsage.failed ? 'Task failed' : 'Task used less than estimate'), agent_tool: actualUsage.agentTool || 'agent', status: 'refunded', balance_after: adjustedBalance });
  }
  return { ok: true as const, charged: used, refunded: refundAmount };
}

export async function refundCredits(userId: string, amount: number, reason: string) {
  const admin = createSupabaseServerAdmin();
  const account = await ensureCreditAccount(userId);
  const safeAmount = Math.max(0, Math.ceil(amount));
  const nextBalance = Number(account.credits_balance ?? 0) + safeAmount;
  await admin.from('user_credits').update({ credits_balance: nextBalance, updated_at: new Date().toISOString() }).eq('user_id', userId);
  await admin.from('credit_transactions').insert({ user_id: userId, title: 'Credit refund', amount: safeAmount, reason, agent_tool: 'system', status: 'refunded', balance_after: nextBalance });
  return { ok: true as const, balance: nextBalance };
}

export async function getCreditHistory(userId: string, limit = 50): Promise<CreditHistoryItem[]> {
  const admin = createSupabaseServerAdmin();
  const { data } = await admin.from('credit_transactions').select('id,title,amount,reason,agent_tool,created_at,status').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
  return (data || []).map((item: any) => ({ id: item.id, title: item.title, amount: Number(item.amount ?? 0), reason: item.reason || '', agentTool: item.agent_tool || null, created_at: item.created_at, status: (item.status as CreditTransactionStatus) || 'charged' }));
}
