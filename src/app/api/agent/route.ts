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
import {
  getUserPlanAndUsage,
  incrementUsage,
  isAdminBypass,
  isDevUnlimitedMode,
  PLAN_LIMITS,
  toUsageEnvelope,
} from '@/lib/usage/usage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

function resolveGmailConnected(params: {
  userProfile?: Record<string, unknown> | null;
}): boolean {
  return Boolean(params.userProfile?.gmail_connected);
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

    const { plan, usage, email } = await getUserPlanAndUsage(supabase, userId);
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('gmail_connected')
      .eq('id', userId)
      .maybeSingle();
    const unlimitedReason = isDevUnlimitedMode() ? 'dev' : isAdminBypass(email) ? 'admin' : null;

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

    const usageBeforeRun = toUsageEnvelope({ plan, usage, unlimitedReason });
    const limit = PLAN_LIMITS[plan].dailyAgentRuns;

    if (!usageBeforeRun.unlimited && usageBeforeRun.current >= limit) {
      return safeJsonResponse(
        {
          error: 'LIMIT_REACHED',
          message: 'Daily limit reached',
          usage: {
            current: usageBeforeRun.current,
            limit: usageBeforeRun.limit,
            remaining: usageBeforeRun.remaining,
            unlimited: usageBeforeRun.unlimited,
            unlimitedReason: usageBeforeRun.unlimitedReason,
          },
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
          current: usageBeforeRun.current,
          limit: usageBeforeRun.limit,
          remaining: usageBeforeRun.remaining,
        },
        gmailConnected: resolveGmailConnected({
          userProfile: (userProfile as Record<string, unknown> | null) || null,
        }),
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

      const usageAfterRun = toUsageEnvelope({
        plan,
        usage: updatedUsage,
        unlimitedReason,
      });

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
          current: usageAfterRun.current,
          limit: usageAfterRun.limit,
          remaining: usageAfterRun.remaining,
          unlimited: usageAfterRun.unlimited,
          unlimitedReason: usageAfterRun.unlimitedReason,
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

    const usageAfterRun = toUsageEnvelope({
      plan,
      usage: updatedUsage,
      unlimitedReason,
    });

    const payload: AgentResponse & {
      usage: { current: number; limit: number; remaining: number; unlimited: boolean; unlimitedReason: 'dev' | 'admin' | null };
      plan: string;
    } = {
      reply: reply || SAFE_AGENT_FALLBACK.reply,
      metadata: {
        intent: agentResult.metadata?.intent || 'general',
        mode: agentResult.metadata?.mode || 'general',
        plan: agentResult.metadata?.plan || 'Partial fallback',
        steps: Array.isArray(agentResult.metadata?.steps)
          ? agentResult.metadata.steps.map((step) => ({
              action: step.title,
              status: step.status === 'failed' ? 'failed' : 'completed',
              summary: step.status === 'failed' ? 'This step could not be completed.' : 'Completed successfully.',
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
        current: usageAfterRun.current,
        limit: usageAfterRun.limit,
        remaining: usageAfterRun.remaining,
        unlimited: usageAfterRun.unlimited,
        unlimitedReason: usageAfterRun.unlimitedReason,
      },
      plan,
    };

    return safeJsonResponse(payload);
  } catch (error) {
    console.error('AGENT_ROUTE_ERROR:', error);
    return safeJsonResponse(SAFE_AGENT_FALLBACK);
  }
}
