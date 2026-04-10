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
import { getUserProfileIntelligence, updateUserProfileIntelligence } from '@/lib/operator/personalization';
import type { OperatorAlertType } from '@/lib/operator/alerts';
import { fetchRelevantUserMemory } from '@/agent/v8/tools/memory-store';
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


function shouldUseOperatorAlertsContext(input: string): boolean {
  const normalized = input.toLowerCase();
  return [
    'what should i do next',
    'any issues',
    'anything important',
    'how can i save',
    'what looks risky',
    'what changed',
    'what should i cancel',
    'deserves attention',
    'subscription',
    'billing',
    'spend',
    'finance',
  ].some((phrase) => normalized.includes(phrase));
}

type OperatorAlertContextRow = {
  id: string;
  user_id: string;
  type: OperatorAlertType;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'dismissed' | 'completed';
  title: string;
  summary: string;
  suggested_action: string;
  source: string;
  dedupe_key: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};


function resolveGmailConnected(params: {
  userProfile?: Record<string, unknown> | null;
}): boolean {
  return Boolean(params.userProfile?.gmail_connected);
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asArrayOfObjects(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    : [];
}

function inferMemorySummaryType(input: string): 'finance' | 'general' {
  return /\b(save|saving|budget|subscription|bill|expense|debt|money|finance|monthly|cost)\b/i.test(input)
    ? 'finance'
    : 'general';
}

export async function POST(req: Request) {
  try {
    console.info('AGENT_ROUTE_PARSE_START');
    const body = await req.json().catch(() => ({}));
    console.info('AGENT_ROUTE_PARSE_DONE');

    const { input, history, imageUri, userId: requestedUserId } = body ?? {};
    const actionType = parseActionType(body?.actionType);

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

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('AGENT_ROUTE_AUTH_ERROR', authError);
      return safeJsonResponse({ error: 'AUTH_REQUIRED', message: 'Please sign in to use chat.' }, 401);
    }

    const userId = authUser?.id;
    if (!userId || userId === 'system_anonymous') {
      return safeJsonResponse({ error: 'AUTH_REQUIRED', message: 'Please sign in to use chat.' }, 401);
    }


    let operatorAlertsContext: OperatorAlertContextRow[] = [];
    if (shouldUseOperatorAlertsContext(String(safeInput || ''))) {
      const operatorAlertRes = await supabase
        .from('operator_alerts')
        .select('id,user_id,type,severity,status,title,summary,suggested_action,source,dedupe_key,metadata,created_at,updated_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (operatorAlertRes.error) {
        console.error('OPERATOR_ALERT_ERROR', {
          action: 'agent_context_fetch',
          userId,
          error: operatorAlertRes.error.message,
        });
      } else {
        operatorAlertsContext = (operatorAlertRes.data || []) as OperatorAlertContextRow[];
      }
    }

    if (requestedUserId && requestedUserId !== userId) {
      console.warn('AGENT_ROUTE_USER_ID_MISMATCH', {
        requestedUserId,
        sessionUserId: userId,
      });
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

    const userProfileIntelligence = await getUserProfileIntelligence(supabase, userId).catch((error) => {
      console.error('USER_PROFILE_INTELLIGENCE_FETCH_ERROR:', error);
      return null;
    });

    const summaryType = inferMemorySummaryType(safeInput || 'Continue');
    const relevantMemories = await fetchRelevantUserMemory({
      userId,
      query: safeInput || 'Continue',
      limit: summaryType === 'finance' ? 8 : 6,
      financeOnly: summaryType === 'finance',
    }).catch((error) => {
      console.error('MEMORY_RETRIEVAL_ERROR:', error);
      return [];
    });

    const { data: financeProfileData } = await supabase
      .from('finance_profiles')
      .select('active_subscriptions,total_monthly_cost,estimated_savings,currency,memory_summary,last_analysis')
      .eq('user_id', userId)
      .maybeSingle();

    const financeProfile = financeProfileData
      ? {
          active_subscriptions: asArrayOfObjects(financeProfileData.active_subscriptions),
          total_monthly_cost: financeProfileData.total_monthly_cost ?? 0,
          estimated_savings: financeProfileData.estimated_savings ?? 0,
          currency: financeProfileData.currency || 'USD',
          memory_summary: financeProfileData.memory_summary || '',
          last_analysis: asObject(financeProfileData.last_analysis),
        }
      : null;

    const memorySummary =
      relevantMemories.length > 0
        ? relevantMemories.slice(0, 3).map((item) => item.content).join(' ')
        : typeof financeProfile?.memory_summary === 'string' && financeProfile.memory_summary.trim().length > 0
          ? financeProfile.memory_summary.trim()
          : 'No prior context available.';

    const memoryEnvelope = {
      summaryType,
      summary: memorySummary,
      financeProfile,
      financeEvents: [],
      semanticMemories: relevantMemories.map((item) => ({
        id: item.id,
        content: item.content,
        type: item.type,
        importance: item.importance,
        relevanceScore: item.relevanceScore || 0,
      })),
    };

    console.info('AGENT_ROUTE_ORCHESTRATOR_START', {
      userId,
      hasImage: Boolean(imageUri),
      historyCount: safeHistory.length,
    });

    const agentResult = await runAgentV8({
      input: safeInput || 'Continue',
      userId,
      history: safeHistory,
      memory: memoryEnvelope,
      operatorAlerts: operatorAlertsContext,
      userProfileIntelligence,
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

    const operatorAlertsStructured = operatorAlertsContext.map((alert) => ({
      id: alert.id,
      severity: alert.severity,
      title: alert.title,
      summary: alert.summary,
      suggestedAction: alert.suggested_action,
      updatedAt: alert.updated_at,
    }));

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

      await updateUserProfileIntelligence({
        supabase,
        userId,
        userMessage: safeInput || '',
        existing: userProfileIntelligence,
      }).catch((error) => {
        console.error('USER_PROFILE_INTELLIGENCE_UPDATE_ERROR:', error);
      });

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
            operator_alerts: operatorAlertsStructured,
          },
          memoryUsed: relevantMemories.length > 0,
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

    await updateUserProfileIntelligence({
      supabase,
      userId,
      userMessage: safeInput || '',
      existing: userProfileIntelligence,
    }).catch((error) => {
      console.error('USER_PROFILE_INTELLIGENCE_UPDATE_ERROR:', error);
    });

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
              summary: step.summary || (step.status === 'failed' ? step.error || 'Step failed.' : 'Step completed.'),
              error: step.error,
            }))
          : [],
        structuredData: {
          ...(agentResult.metadata?.structuredData || {}),
          ...(shouldAttachFinance ? { finance: normalizedFinance } : {}),
          ...(operatorAlertsStructured.length ? { operator_alerts: operatorAlertsStructured } : {}),
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
