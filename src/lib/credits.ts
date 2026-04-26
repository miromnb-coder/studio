import type { PlanId } from './plans';
import {
  estimateCreditCost,
  reserveCredits,
  finalizeCreditCharge,
  refundCredits,
  getCreditBalance,
  refreshMonthlyCredits,
  getCreditHistory,
  type CreditEstimate,
} from '@/lib/credits/credit-engine';

export type CreditAction = 'chat.fast' | 'chat.agent' | 'manual.grant';

export async function chargeEstimatedCredits(input: {
  userId: string;
  message?: string;
  mode?: 'fast' | 'agent';
  hasFile?: boolean;
  usesWeb?: boolean;
  model?: string;
  tools?: string[];
  executionSteps?: number;
}) {
  const estimate = estimateCreditCost({
    message: input.message,
    mode: input.mode,
    hasFile: input.hasFile,
    usesWeb: input.usesWeb,
    model: input.model,
    tools: input.tools,
    executionSteps: input.executionSteps,
  });

  const reservation = await reserveCredits(input.userId, estimate);
  if (!reservation.ok) {
    return {
      ok: false as const,
      account: { credits: reservation.credits },
      required: reservation.required,
      estimate,
      error: 'not_enough_credits' as const,
    };
  }

  return {
    ok: true as const,
    reservationId: reservation.reservationId,
    account: { credits: reservation.remainingCredits },
    estimate,
  };
}

export async function settleCreditCharge(reservationId: string, usage: { used: number; failed?: boolean; reason?: string }) {
  return finalizeCreditCharge(reservationId, usage);
}

export async function grantCredits(input: { userId: string; amount: number; reason?: string }) {
  return refundCredits(input.userId, input.amount, input.reason || 'Manual credit grant');
}

export async function getCreditSnapshot(input: { userId: string; plan?: PlanId }) {
  await refreshMonthlyCredits(input.userId);
  const balance = await getCreditBalance(input.userId);
  const history = await getCreditHistory(input.userId);

  return {
    userId: balance.userId,
    plan: balance.plan,
    credits: balance.credits,
    monthlyCredits: balance.monthlyCredits,
    freeCredits: balance.freeCredits,
    monthlyUsed: balance.monthlyUsed,
    history,
    nextRefreshType: 'monthly',
  };
}

export { estimateCreditCost };
export type { CreditEstimate };
