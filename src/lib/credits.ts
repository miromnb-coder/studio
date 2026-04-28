import type { PlanId } from './plans';
import {
  estimateCreditCost,
  reserveCredits,
  finalizeCreditCharge,
  refundCredits,
  getCreditBalance,
  refreshCreditCycles,
  getCreditHistory,
  type CreditEstimate,
  applyCreditReward,
} from '@/lib/credits/credit-engine';

export type CreditAction = 'chat.fast' | 'chat.agent' | 'manual.grant';

export async function chargeEstimatedCredits(input: {
  userId: string;
  message?: string;
  mode?: 'fast' | 'agent';
  hasFile?: boolean;
  fileCount?: number;
  hasImage?: boolean;
  imageCount?: number;
  usesWeb?: boolean;
  model?: string;
  provider?: 'groq' | 'openai';
  tools?: string[];
  executionSteps?: number;
  reasoningDepth?: 'quick' | 'standard' | 'deep' | 'expert';
  routingMetadata?: {
    provider?: string;
    model?: string;
    costTier?: string;
    routingReason?: string;
    fallbackUsed?: boolean;
  };
}) {
  const estimate = estimateCreditCost({
    message: input.message,
    mode: input.mode,
    hasFile: input.hasFile,
    fileCount: input.fileCount,
    hasImage: input.hasImage,
    imageCount: input.imageCount,
    usesWeb: input.usesWeb,
    model: input.model,
    provider: input.provider,
    tools: input.tools,
    executionSteps: input.executionSteps,
    reasoningDepth: input.reasoningDepth,
  });

  const reservation = await reserveCredits(input.userId, estimate, input.routingMetadata);
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

export async function settleCreditCharge(
  reservationId: string,
  usage: { used: number; failed?: boolean; reason?: string; title?: string; agentTool?: string },
) {
  return finalizeCreditCharge(reservationId, usage);
}

export async function grantCredits(input: { userId: string; amount: number; reason?: string }) {
  return refundCredits(input.userId, input.amount, input.reason || 'Manual credit grant', 'Credit reward');
}

export async function grantReward(input: { userId: string; reward: 'streak_7' | 'beta_tester' | 'invite_friend' }) {
  return applyCreditReward(input.userId, input.reward);
}

export async function getCreditSnapshot(input: { userId: string; plan?: PlanId; timeZone?: string }) {
  await refreshCreditCycles(input.userId, input.timeZone);
  const balance = await getCreditBalance(input.userId, input.timeZone);
  const history = await getCreditHistory(input.userId, { page: 1, pageSize: 20 });

  return {
    userId: balance.userId,
    plan: balance.plan,
    credits: balance.credits,
    monthlyCredits: balance.monthlyCredits,
    freeCredits: balance.freeCredits,
    monthlyUsed: balance.monthlyUsed,
    history,
    nextRefreshType: 'daily_and_monthly',
  };
}

export async function getCreditHistoryPage(input: { userId: string; page?: number; pageSize?: number }) {
  return getCreditHistory(input.userId, { page: input.page, pageSize: input.pageSize });
}

export { estimateCreditCost };
export type { CreditEstimate };
