import { NextResponse } from 'next/server';
import { runAgentV8 } from '@/agent/v8/orchestrator';
import type { AgentResponse } from '@/types/agent-response';
import {
  normalizeFinanceAnalysis,
  runFinanceAction,
  safeFinanceActionFallback,
} from '@/lib/finance/normalize';
import type { FinanceActionType } from '@/lib/finance/types';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import {
  detectMemoryIntent,
  extractImportantMemory,
  retrieveRelevantMemory,
  persistSmartMemory,
  type RetrievedMemoryContext,
} from '@/lib/memory/smart-memory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type UserPlan = 'FREE' | 'PREMIUM';

type UsageSnapshot = {
  agentRuns: number;
  premiumActionRuns: number;
  usageDate: string;
};

const PLAN_LIMITS: Record<UserPlan, { dailyAgentRuns: number }> = {
  FREE: { dailyAgentRuns: 10 },
  PREMIUM: { dailyAgentRuns: 1000 },
};

const SAFE_AGENT_FALLBACK: AgentResponse = {
  reply: 'I ran into an issue, but here’s what I could analyze so far.',
  metadata: {
    intent: 'general',
    mode: 'general',
    plan: 'Partial fallback',
    steps: [],
    structuredData: null,
    suggestedActions: [],
    memoryUsed: false,
    verificationPassed: false,
    iterationCount: 0,
  },
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}


function safeJsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

function parseActionType(raw: unknown): FinanceActionType | null {
  if (
    raw === 'create_savings_plan' ||
    raw === 'find_alternatives' ||
    raw === 'draft_cancellation'
  ) {
    return raw;
  }
  return null;
}

function normalizePlan(value: unknown): UserPlan {
  const upper = String(value || 'FREE').toUpperCase();
  return upper === 'PREMIUM' || upper === 'PRO' ? 'PREMIUM' : 'FREE';
}

async function getUserPlanAndUsage(supabase: any, userId: string): Promise<{
  plan: UserPlan;
  usage: UsageSnapshot;
}> {
  const usageDate = todayKey();

  const [profileResult, usageResult] = await Promise.all([
    supabase.from('profiles').select('plan').eq('id', userId).maybeSingle(),
    supabase
      .from('usage_daily')
      .select('agent_runs,premium_action_runs,usage_date')
      .eq('user_id', userId)
      .eq('usage_date', usageDate)
      .maybeSingle(),
  ]);

  if (profileResult.error) {
    console.error('SUPABASE_PROFILE_READ_ERROR:', profileResult.error);
  }

  if (usageResult.error) {
    console.error('SUPABASE_USAGE_READ_ERROR:', usageResult.error);
  }

  const plan = normalizePlan(profileResult.data?.plan);

  return {
    plan,
    usage: {
      agentRuns: typeof usageResult.data?.agent_runs === 'number' ? usageResult.data.agent_runs : 0,
      premiumActionRuns:
        typeof usageResult.data?.premium_action_runs === 'number'
          ? usageResult.data.premium_action_runs
          : 0,
      usageDate,
    },
  };
}

async function incrementUsage(
  supabase: any,
  userId: string,
  currentUsage: UsageSnapshot,
  kind: 'agent' | 'premium_action' = 'agent',
): Promise<UsageSnapshot> {
  const nextUsage: UsageSnapshot = {
    usageDate: currentUsage.usageDate || todayKey(),
    agentRuns: currentUsage.agentRuns,
    premiumActionRuns: currentUsage.premiumActionRuns,
  };

  if (kind === 'premium_action') {
    nextUsage.premiumActionRuns += 1;
  } else {
    nextUsage.agentRuns += 1;
  }

  const { error } = await supabase.from('usage_daily').upsert(
    {
      user_id: userId,
      usage_date: nextUsage.usageDate,
      agent_runs: nextUsage.agentRuns,
      premium_action_runs: nextUsage.premiumActionRuns,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,usage_date' },
  );

  if (error) {
    console.error('SUPABASE_USAGE_UPSERT_ERROR:', error);
    return currentUsage;
  }

  return nextUsage;
}

export async function POST(req: Request) {
  try {
    console.info('AGENT_ROUTE_PARSE_START');
    const body = await req.json().catch(() => ({}));
    console.info('AGENT_ROUTE_PARSE_DONE');

    const { input, history, imageUri, userId } = body ?? {};
    const actionType = parseActionType(body?.actionType);

    if (!userId || userId === 'system_anonymous') {
      return safeJsonResponse(
        {
          error: 'AUTH_REQUIRED',
          message: 'Please sign in to use chat.',
        },
        401,
      );
    }

    const safeHistory = (history || [])
      .filter((m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m: any) => ({
        role: m.role || 'user',
        content: m.content.trim(),
      }));

    const safeInput =
      typeof input === 'string' && input.trim().length > 0
        ? input.trim()
        : imageUri
          ? '[Analyze visual data]'
          : null;

    if (!safeInput && safeHistory.length === 0) {
      return safeJsonResponse({ error: 'No valid content provided.' }, 400);
    }

    const supabase = await createSupabaseServerClient().catch((error) => {
      console.error('SUPABASE_SERVER_CLIENT_ERROR:', error);
      return null;
    });

    if (!supabase) {
      console.error('SUPABASE_UNAVAILABLE');
      return safeJsonResponse(SAFE_AGENT_FALLBACK);
    }

    const { plan, usage } = await getUserPlanAndUsage(supabase, userId);

    if (actionType && plan !== 'PREMIUM') {
      return safeJsonResponse(
        {
          error: 'PREMIUM_REQUIRED',
          message: 'Finance actions require Premium plan.',
          plan,
        },
        403,
      );
    }

    const limit = PLAN_LIMITS[plan].dailyAgentRuns;

    if (usage.agentRuns >= limit) {
      return safeJsonResponse(
        {
          error: 'LIMIT_REACHED',
          message: 'Daily limit reached',
          usage: { current: usage.agentRuns, limit, remaining: 0 },
          plan,
        },
        403,
      );
    }

    const memoryIntent = await detectMemoryIntent(safeInput || 'Continue').catch((error) => {
      console.error('MEMORY_INTENT_ERROR:', error);
      return 'general' as const;
    });

    const fallbackMemory: RetrievedMemoryContext = {
      userId,
      summaryType: memoryIntent,
      summary: 'No prior context available.',
    };

    const retrievedMemory: RetrievedMemoryContext = await retrieveRelevantMemory(
      supabase,
      userId,
      memoryIntent,
      safeInput || '',
    ).catch((error) => {
      console.error('MEMORY_RETRIEVAL_ERROR:', error);
      return fallbackMemory;
    });

    console.info('AGENT_ROUTE_ORCHESTRATOR_START', {
      userId,
      hasImage: Boolean(imageUri),
      historyCount: safeHistory.length,
    });

    const agentResult = await runAgentV8({
      input: safeInput || 'Continue',
      userId,
      history: safeHistory,
      memory: retrievedMemory as unknown as Record<string, unknown>,
      productState: {
        plan,
        usage: {
          current: usage.agentRuns,
          limit,
          remaining: Math.max(limit - usage.agentRuns, 0),
        },
        gmailConnected: Boolean((retrievedMemory as any)?.gmailConnected),
      },
    }).catch((error) => {
      console.error('AGENT_V8_EXECUTION_ERROR:', error);
      return null;
    });

    console.info('AGENT_ROUTE_ORCHESTRATOR_DONE', {
      ok: Boolean(agentResult),
      intent: agentResult?.metadata?.intent || 'unknown',
      stepCount: agentResult?.metadata?.steps?.length || 0,
    });

    if (!agentResult) {
      return safeJsonResponse(SAFE_AGENT_FALLBACK);
    }

    const normalizedFinance = normalizeFinanceAnalysis(agentResult.metadata?.structuredData || {});
    const shouldAttachFinance =
      agentResult.metadata?.intent === 'finance' ||
      Boolean((agentResult.metadata?.structuredData || {}).detect_leaks) ||
      Boolean(actionType);

    if (actionType) {
      const actionResult = runFinanceAction(actionType, normalizedFinance);
      let updatedUsage = await incrementUsage(supabase, userId, usage, 'agent').catch((error) => {
        console.error('ACTION_AGENT_USAGE_INCREMENT_ERROR:', error);
        return usage;
      });

      if (actionResult.type !== 'error') {
        updatedUsage = await incrementUsage(supabase, userId, updatedUsage, 'premium_action').catch((error) => {
          console.error('PREMIUM_ACTION_USAGE_INCREMENT_ERROR:', error);
          return updatedUsage;
        });
      }

      const extracted = await extractImportantMemory({
        intent: memoryIntent,
        userInput: safeInput || '',
        assistantReply: actionResult.summary,
        finance: normalizedFinance,
        actionType,
      }).catch((error) => {
        console.error('SMART_MEMORY_EXTRACT_ACTION_ERROR:', error);
        return null;
      });

      if (extracted) {
        await persistSmartMemory(
          supabase,
          userId,
          extracted,
          retrievedMemory.financeProfile,
        ).catch((error) => {
          console.error('SMART_MEMORY_PERSIST_ACTION_ERROR:', error);
        });
      }

      return safeJsonResponse({
        reply: actionResult.summary,
        metadata: {
          intent: 'finance',
          plan: 'Finance follow-up action execution',
          steps: [
            {
              action: actionType,
              status: actionResult.type === 'error' ? 'failed' : 'completed',
              summary: actionResult.summary,
            },
          ],
          structuredData: {
            finance: normalizedFinance,
            actionResult:
              actionResult.type === 'error' ? safeFinanceActionFallback() : actionResult,
          },
          memoryUsed: !!retrievedMemory.summary,
          iterationCount: 1,
        },
        usage: {
          current: updatedUsage.agentRuns,
          limit,
          remaining: Math.max(limit - updatedUsage.agentRuns, 0),
        },
        plan,
      });
    }

    console.info('AGENT_ROUTE_RESPONSE_SYNTHESIS_START');
    const reply = agentResult.reply || '';
    console.info('AGENT_ROUTE_RESPONSE_SYNTHESIS_DONE', {
      hasReply: reply.trim().length > 0,
    });

    const updatedUsage = await incrementUsage(supabase, userId, usage, 'agent').catch((error) => {
      console.error('USAGE_INCREMENT_ERROR:', error);
      return usage;
    });

    if (reply.trim().length > 0) {
      const extracted = await extractImportantMemory({
        intent: memoryIntent,
        userInput: safeInput || '',
        assistantReply: reply,
        finance: normalizedFinance,
        actionType: null,
      }).catch((error) => {
        console.error('SMART_MEMORY_EXTRACT_ERROR:', error);
        return null;
      });

      if (extracted) {
        await persistSmartMemory(
          supabase,
          userId,
          extracted,
          retrievedMemory.financeProfile,
        ).catch((error) => {
          console.error('SMART_MEMORY_PERSIST_ERROR:', error);
        });
      }
    }

    const payload: AgentResponse & {
      usage: { current: number; limit: number; remaining: number };
      plan: string;
    } = {
      reply: reply || SAFE_AGENT_FALLBACK.reply,
      metadata: {
        intent: agentResult.metadata?.intent || 'general',
        mode: agentResult.metadata?.mode || 'general',
        plan: agentResult.metadata?.plan || 'Partial fallback',
        steps: Array.isArray(agentResult.metadata?.steps)
          ? agentResult.metadata.steps.map((step) => ({
              action: `${step.tool}: ${step.summary}`,
              status: step.status === 'failed' ? 'failed' : 'completed',
              summary: step.summary,
              error: step.error,
            }))
          : [],
        structuredData: {
          ...(agentResult.metadata?.structuredData || {}),
          ...(shouldAttachFinance ? { finance: normalizedFinance } : {}),
        },
        suggestedActions: agentResult.metadata?.suggestedActions || [],
        memoryUsed: !!agentResult.metadata?.memoryUsed,
        verificationPassed: !!agentResult.metadata?.verificationPassed,
        iterationCount: Array.isArray(agentResult.metadata?.steps) ? agentResult.metadata.steps.length : 0,
      },
      usage: {
        current: updatedUsage.agentRuns,
        limit,
        remaining: Math.max(limit - updatedUsage.agentRuns, 0),
      },
      plan,
    };

    return safeJsonResponse(payload);
  } catch (error) {
    console.error('AGENT_ROUTE_ERROR:', error);
    return safeJsonResponse(SAFE_AGENT_FALLBACK);
  }
}
