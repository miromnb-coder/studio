import crypto from 'node:crypto';
import type { AgentResponse } from '@/types/agent-response';
import {
  normalizeFinanceAnalysis,
  runFinanceAction,
  safeFinanceActionFallback,
} from '@/lib/finance/normalize';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import {
  getUserProfileIntelligence,
  updateUserProfileIntelligence,
} from '@/lib/operator/personalization';
import { fetchRelevantUserMemory } from '@/agent/memory-store';
import {
  extractMemoryCandidates,
  inferRelevantCategories,
  persistPersonalMemoryCandidates,
} from '@/lib/memory/personal-memory';
import { resolveResponseMode } from '@/agent/mode/resolve-response-mode';
import { fetchRecentRecommendationOutcomes } from '@/lib/operator/outcomes';
import {
  getUserPlanAndUsage,
  incrementUsage,
  isAdminBypass,
  isDevUnlimitedMode,
  PLAN_LIMITS,
  toUsageEnvelope,
  getUserBonusAgentRuns,
  consumeOneBonusAgentRun,
} from '@/lib/usage/usage';
import {
  formatBrowserSearchContext,
  hasBrowserSearchConfigured,
  inferBrowserSearchMode,
  runBrowserSearch,
} from '@/lib/browser-search/search';
import { loadUserIntelligence } from '@/agent/user-intelligence/storage/load-user-intelligence';
import { saveUserIntelligence } from '@/agent/user-intelligence/storage/save-user-intelligence';
import { buildUserIntelligenceSummary } from '@/agent/user-intelligence/summarize/build-user-intelligence-summary';
import { runNewAgent } from './run-new-agent';
import {
  applyConversationLearningIfNeeded,
} from './user-intelligence-learning';
import {
  SAFE_AGENT_FALLBACK,
  asArrayOfObjects,
  asObject,
  buildBrowserSuggestedActions,
  buildOperatorResponse,
  inferMemorySummaryType,
  normalizeAttachments,
  parseActionType,
  resolveCalendarConnected,
  resolveGmailConnected,
  safeJsonResponse,
  shouldRunBrowserTool,
  shouldUseOperatorAlertsContext,
  type BrowserSearchContext,
  type OperatorAlertContextRow,
} from './route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ParsedRequest = {
  attachments: ReturnType<typeof normalizeAttachments>;
  actionType: ReturnType<typeof parseActionType>;
  safeHistory: Array<{ role: string; content: string }>;
  safeInput: string | null;
  imageUri: unknown;
  requestedUserId: unknown;
};

function parseRequestBody(body: Record<string, unknown>): ParsedRequest {
  const input = body.input;
  const history = Array.isArray(body.history) ? body.history : [];
  const imageUri = body.imageUri;

  const attachments = normalizeAttachments(body.attachments);
  const actionType = parseActionType(body.actionType);

  const safeHistory = history
    .filter(
      (m: unknown): m is { role?: string; content?: string } =>
        Boolean(
          m &&
            typeof m === 'object' &&
            typeof (m as { content?: unknown }).content === 'string' &&
            ((m as { content?: string }).content || '').trim().length > 0,
        ),
    )
    .map((m) => ({
      role: m.role || 'user',
      content: (m.content || '').trim(),
    }));

  const safeInput =
    typeof input === 'string' && input.trim().length > 0
      ? input.trim()
      : imageUri
        ? '[Analyze visual data]'
        : attachments.length > 0
          ? '[Analyze attachments]'
          : null;

  return {
    attachments,
    actionType,
    safeHistory,
    safeInput,
    imageUri,
    requestedUserId: body.userId,
  };
}

async function resolveAuthContext(requestId: string) {
  const supabase = await createSupabaseServerClient().catch((error) => {
    console.error('SUPABASE_SERVER_CLIENT_ERROR:', error);
    return null;
  });

  if (!supabase) {
    return { errorResponse: safeJsonResponse(SAFE_AGENT_FALLBACK), supabase: null, userId: null };
  }

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error('AGENT_ROUTE_AUTH_ERROR', {
      requestId,
      error: authError,
    });
    return {
      errorResponse: safeJsonResponse(
        {
          error: 'AUTH_REQUIRED',
          message: 'Please sign in to use chat.',
        },
        401,
      ),
      supabase,
      userId: null,
    };
  }

  const userId = authUser?.id;
  if (!userId || userId === 'system_anonymous') {
    return {
      errorResponse: safeJsonResponse(
        {
          error: 'AUTH_REQUIRED',
          message: 'Please sign in to use chat.',
        },
        401,
      ),
      supabase,
      userId: null,
    };
  }

  return { errorResponse: null, supabase, userId };
}

async function maybeLoadUserIntelligence(userId: string) {
  return loadUserIntelligence(userId, { createIfMissing: true }).catch((error) => {
    console.error('USER_INTELLIGENCE_LOAD_ERROR', { userId, error });
    return null;
  });
}

export async function POST(req: Request) {
  const requestId = req.headers.get('x-kivo-request-id') || crypto.randomUUID();
  const startedAt = Date.now();

  try {
    console.info('AGENT_ROUTE_PARSE_START', { requestId });
    const body = await req.json().catch(() => ({}));
    console.info('AGENT_ROUTE_PARSE_DONE', { requestId });

    const {
      attachments,
      actionType,
      safeHistory,
      safeInput,
      imageUri,
      requestedUserId,
    } = parseRequestBody((body ?? {}) as Record<string, unknown>);

    if (!safeInput && safeHistory.length === 0 && attachments.length === 0) {
      return safeJsonResponse({ error: 'No valid content provided.' }, 400);
    }

    const authContext = await resolveAuthContext(requestId);
    if (authContext.errorResponse || !authContext.supabase || !authContext.userId) {
      return authContext.errorResponse ?? safeJsonResponse(SAFE_AGENT_FALLBACK);
    }

    const { supabase, userId } = authContext;

    if (requestedUserId && requestedUserId !== userId) {
      console.warn('AGENT_ROUTE_USER_ID_MISMATCH', {
        requestId,
        requestedUserId,
        sessionUserId: userId,
      });
    }

    const userIntelligenceProfile = await maybeLoadUserIntelligence(userId);
    const userIntelligenceSummary = buildUserIntelligenceSummary(userIntelligenceProfile);

    let operatorAlertsContext: OperatorAlertContextRow[] = [];
    if (shouldUseOperatorAlertsContext(String(safeInput || ''))) {
      const operatorAlertRes = await supabase
        .from('operator_alerts')
        .select(
          'id,user_id,type,severity,status,title,summary,suggested_action,source,dedupe_key,metadata,created_at,updated_at',
        )
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
        operatorAlertsContext =
          (operatorAlertRes.data || []) as OperatorAlertContextRow[];
      }
    }

    const { plan, usage, email } = await getUserPlanAndUsage(supabase, userId);
    const bonusAgentRuns = await getUserBonusAgentRuns(supabase, userId);

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('gmail_connected, google_calendar_connected')
      .eq('id', userId)
      .maybeSingle();

    const unlimitedReason = isDevUnlimitedMode()
      ? 'dev'
      : isAdminBypass(email)
        ? 'admin'
        : null;

    if (actionType && plan !== 'PREMIUM') {
      return safeJsonResponse(
        {
          error: 'premium_required',
          message: 'Finance actions require Premium plan.',
          plan,
        },
        403,
      );
    }

    const usageBeforeRun = toUsageEnvelope({ plan, usage, unlimitedReason });
    const limit = PLAN_LIMITS[plan].dailyAgentRuns;
    const hasBonusRun = bonusAgentRuns > 0;
    const overBaseLimit = usageBeforeRun.current >= limit;

    if (!usageBeforeRun.unlimited && overBaseLimit && !hasBonusRun) {
      return safeJsonResponse(
        {
          error: 'limit_reached',
          message: 'Daily agent limit reached',
          limitKey: 'daily_agent_runs',
          limitValue: usageBeforeRun.limit,
          currentValue: usageBeforeRun.current,
          usage: {
            current: usageBeforeRun.current,
            limit: usageBeforeRun.limit,
            remaining: usageBeforeRun.remaining,
            unlimited: usageBeforeRun.unlimited,
            unlimitedReason: usageBeforeRun.unlimitedReason,
          },
          bonusAgentRuns,
          plan,
        },
        402,
      );
    }

    const userProfileIntelligence = await getUserProfileIntelligence(
      supabase,
      userId,
    ).catch((error) => {
      console.error('USER_PROFILE_INTELLIGENCE_FETCH_ERROR:', error);
      return null;
    });

    const recommendationOutcomes =
      await fetchRecentRecommendationOutcomes(supabase, userId).catch(
        (error) => {
          console.error('RECOMMENDATION_OUTCOMES_FETCH_ERROR:', error);
          return [];
        },
      );

    const summaryType = inferMemorySummaryType(safeInput || 'Continue');
    const relevantMemories = await fetchRelevantUserMemory({
      supabase,
      userId,
      query: safeInput || 'Continue',
      limit: summaryType === 'finance' ? 8 : 6,
      financeOnly: summaryType === 'finance',
      preferredTypes: inferRelevantCategories(safeInput || 'Continue'),
    }).catch((error) => {
      console.error('MEMORY_RETRIEVAL_ERROR:', error);
      return [];
    });

    const { data: financeProfileData } = await supabase
      .from('finance_profiles')
      .select(
        'active_subscriptions,total_monthly_cost,estimated_savings,currency,memory_summary,last_analysis',
      )
      .eq('user_id', userId)
      .maybeSingle();

    const financeProfile = financeProfileData
      ? {
          active_subscriptions: asArrayOfObjects(
            financeProfileData.active_subscriptions,
          ),
          total_monthly_cost: financeProfileData.total_monthly_cost ?? 0,
          estimated_savings: financeProfileData.estimated_savings ?? 0,
          currency: financeProfileData.currency || 'USD',
          memory_summary: financeProfileData.memory_summary || '',
          last_analysis: asObject(financeProfileData.last_analysis),
        }
      : null;

    const memorySummary =
      relevantMemories.length > 0
        ? relevantMemories
            .slice(0, 3)
            .map((item) => item.content)
            .join(' ')
        : typeof financeProfile?.memory_summary === 'string' &&
            financeProfile.memory_summary.trim().length > 0
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
      requestId,
      userId,
      hasImage: Boolean(imageUri),
      attachmentCount: attachments.length,
      historyCount: safeHistory.length,
      bonusAgentRuns,
    });

    const responseMode = resolveResponseMode({
      input: safeInput || 'Continue',
      history: safeHistory,
      hasAttachments: attachments.length > 0,
      requestedActionType: actionType,
    });

    const browserEnabled = hasBrowserSearchConfigured();
    let browserSearchContext: BrowserSearchContext = {
      enabled: browserEnabled,
      used: false,
      mode: null,
      provider: null,
      query: null,
      results: [],
      error: null,
    };

    if (
      browserEnabled &&
      shouldRunBrowserTool({
        input: safeInput || 'Continue',
        attachments,
        actionType,
        responseMode,
      })
    ) {
      const inferredMode = inferBrowserSearchMode(safeInput || 'Continue');

      try {
        const browserSearch = await runBrowserSearch({
          query: safeInput || 'Continue',
          mode: inferredMode,
        });

        browserSearchContext = {
          enabled: true,
          used: browserSearch.results.length > 0,
          mode: browserSearch.mode,
          provider: browserSearch.provider,
          query: safeInput || 'Continue',
          results: browserSearch.results,
          error: null,
        };
      } catch (error) {
        console.error('AGENT_BROWSER_SEARCH_ERROR', {
          requestId,
          error,
        });

        browserSearchContext = {
          enabled: true,
          used: false,
          mode: inferredMode,
          provider: null,
          query: safeInput || 'Continue',
          results: [],
          error: error instanceof Error ? error.message : 'Browser search failed.',
        };
      }
    }

    const browserSystemMessage =
      browserSearchContext.used &&
      browserSearchContext.query &&
      browserSearchContext.mode &&
      browserSearchContext.provider
        ? {
            role: 'system',
            content: formatBrowserSearchContext({
              query: browserSearchContext.query,
              mode: browserSearchContext.mode,
              provider: browserSearchContext.provider,
              results: browserSearchContext.results,
            }),
          }
        : null;

    const enrichedHistory = browserSystemMessage
      ? [browserSystemMessage, ...safeHistory]
      : safeHistory;

    const agentResult = await runNewAgent({
      input: safeInput || 'Continue',
      userId,
      history: enrichedHistory,
      memory: memoryEnvelope,
      operatorAlerts: operatorAlertsContext,
      outcomes: recommendationOutcomes,
      userProfileIntelligence,
      userIntelligenceSummary,
      attachments,
      productState: {
        plan,
        usage: {
          current: usageBeforeRun.current,
          limit: usageBeforeRun.limit,
          remaining: usageBeforeRun.remaining,
          bonusAgentRuns,
        },
        gmailConnected: resolveGmailConnected({
          userProfile: (userProfile as Record<string, unknown> | null) || null,
        }),
        calendarConnected: resolveCalendarConnected({
          userProfile: (userProfile as Record<string, unknown> | null) || null,
        }),
        browserConnected: browserEnabled,
        browserSearchUsed: browserSearchContext.used,
        browserSearchMode: browserSearchContext.mode,
        browserSearchProvider: browserSearchContext.provider,
        attachmentCount: attachments.length,
        responseModeHint: responseMode,
      },
    });

    if (!agentResult) {
      console.error('AGENT_VNEXT_EXECUTION_ERROR:', { requestId });
      console.error('AGENT_EXECUTION_ERROR', {
        requestId,
        mode: 'vNext',
      });
      return safeJsonResponse(SAFE_AGENT_FALLBACK);
    }

    console.info('AGENT_ROUTE_ORCHESTRATOR_DONE', {
      requestId,
      ok: true,
      intent: agentResult.metadata?.intent || 'unknown',
      stepCount: agentResult.metadata?.steps?.length || 0,
    });

    const normalizedFinance = normalizeFinanceAnalysis(
      agentResult.metadata?.structuredData || {},
    );
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
      let updatedUsage = usage;

      if (!usageBeforeRun.unlimited && overBaseLimit && hasBonusRun) {
        await consumeOneBonusAgentRun(supabase, userId);
      } else {
        updatedUsage = await incrementUsage(
          supabase,
          userId,
          usage,
          'agent',
        ).catch((error) => {
          console.error('ACTION_AGENT_USAGE_INCREMENT_ERROR:', error);
          return usage;
        });
      }

      if (actionResult.type !== 'error') {
        updatedUsage = await incrementUsage(
          supabase,
          userId,
          updatedUsage,
          'premium_action',
        ).catch((error) => {
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

      if (userIntelligenceProfile) {
        const learned = applyConversationLearningIfNeeded({
          profile: userIntelligenceProfile,
          userId,
          userInput: safeInput || '',
          reply: actionResult.summary,
          intent: 'finance',
          responseLanguage: 'en',
          responseMode: 'tool',
          isError: actionResult.type === 'error',
        });

        if (learned.shouldLearn) {
          await saveUserIntelligence(learned.updatedProfile).catch((error) => {
            console.error('USER_INTELLIGENCE_SAVE_ERROR', { userId, error });
          });
        }
      }

      const usageAfterRun = toUsageEnvelope({
        plan,
        usage: updatedUsage,
        unlimitedReason,
      });

      const remainingBonusAgentRuns = await getUserBonusAgentRuns(supabase, userId);

      return safeJsonResponse({
        reply: actionResult.summary,
        metadata: {
          intent: 'finance',
          responseMode: 'tool',
          plan: 'Finance follow-up action execution',
          steps: [
            {
              action: actionType,
              status:
                actionResult.type === 'error' ? 'failed' : 'completed',
              summary: actionResult.summary,
            },
          ],
          structuredData: {
            finance: normalizedFinance,
            actionResult:
              actionResult.type === 'error'
                ? safeFinanceActionFallback()
                : actionResult,
            operator_alerts: operatorAlertsStructured,
            attachments,
          },
          operatorResponse: buildOperatorResponse({
            answer: actionResult.summary,
            metadata: {
              plan: 'Finance follow-up action execution',
              suggestedActions: [],
            },
            structuredData: {
              finance: normalizedFinance as unknown as Record<string, unknown>,
              operator_alerts: operatorAlertsStructured,
            },
            responseMode: 'tool',
          }),
          memoryUsed: relevantMemories.length > 0,
          iterationCount: 1,
        },
        operatorResponse: buildOperatorResponse({
          answer: actionResult.summary,
          metadata: {
            plan: 'Finance follow-up action execution',
            suggestedActions: [],
          },
          structuredData: {
            finance: normalizedFinance as unknown as Record<string, unknown>,
            operator_alerts: operatorAlertsStructured,
          },
          responseMode: 'tool',
        }),
        usage: {
          current: usageAfterRun.current,
          limit: usageAfterRun.limit,
          remaining: usageAfterRun.remaining,
          unlimited: usageAfterRun.unlimited,
          unlimitedReason: usageAfterRun.unlimitedReason,
          bonusAgentRuns: remainingBonusAgentRuns,
        },
        plan,
      });
    }

    console.info('AGENT_ROUTE_RESPONSE_SYNTHESIS_START', { requestId });
    const reply = agentResult.reply || '';
    const memoryCandidates = extractMemoryCandidates({
      userInput: safeInput || '',
      assistantReply: reply || '',
    });
    console.info('AGENT_ROUTE_RESPONSE_SYNTHESIS_DONE', {
      requestId,
      hasReply: reply.trim().length > 0,
      memoryCandidates: memoryCandidates.length,
    });

    let updatedUsage = usage;

    if (!usageBeforeRun.unlimited && overBaseLimit && hasBonusRun) {
      await consumeOneBonusAgentRun(supabase, userId);
    } else {
      updatedUsage = await incrementUsage(
        supabase,
        userId,
        usage,
        'agent',
      ).catch((error) => {
        console.error('USAGE_INCREMENT_ERROR:', error);
        return usage;
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

    if (userIntelligenceProfile) {
      const learned = applyConversationLearningIfNeeded({
        profile: userIntelligenceProfile,
        userId,
        userInput: safeInput || '',
        reply,
        intent: String(agentResult.metadata?.intent || 'general'),
        responseLanguage: String(agentResult.metadata?.goal?.responseLanguage || 'en'),
        responseMode,
      });

      if (learned.shouldLearn) {
        await saveUserIntelligence(learned.updatedProfile).catch((error) => {
          console.error('USER_INTELLIGENCE_SAVE_ERROR', { userId, error });
        });
      }
    }

    const storedMemoryCount = await persistPersonalMemoryCandidates({
      supabase,
      userId,
      candidates: memoryCandidates,
    }).catch((error) => {
      console.error('PERSONAL_MEMORY_PERSIST_ERROR', error);
      return 0;
    });

    const usageAfterRun = toUsageEnvelope({
      plan,
      usage: updatedUsage,
      unlimitedReason,
    });

    const remainingBonusAgentRuns = await getUserBonusAgentRuns(supabase, userId);

    const payload: AgentResponse & {
      usage: {
        current: number;
        limit: number;
        remaining: number;
        unlimited: boolean;
        unlimitedReason: 'dev' | 'admin' | null;
        bonusAgentRuns: number;
      };
      plan: string;
    } = {
      reply: reply || SAFE_AGENT_FALLBACK.reply,
      metadata: {
        intent: agentResult.metadata?.intent || 'general',
        mode: agentResult.metadata?.mode || 'general',
        plan: agentResult.metadata?.plan || 'Partial fallback',
        steps: [
          ...(browserSearchContext.used
            ? [
                {
                  action: 'browser_search',
                  status: 'completed',
                  summary: `Searched the live web for "${browserSearchContext.query}".`,
                  tool: 'browser_search',
                },
              ]
            : browserSearchContext.error
              ? [
                  {
                    action: 'browser_search',
                    status: 'failed',
                    summary: browserSearchContext.error,
                    error: browserSearchContext.error,
                    tool: 'browser_search',
                  },
                ]
              : []),
          ...(Array.isArray(agentResult.metadata?.steps)
            ? agentResult.metadata.steps.map((step) => ({
                action: step.title,
                status:
                  step.status === 'failed' ? 'failed' : 'completed',
                summary:
                  step.summary ||
                  (step.status === 'failed'
                    ? step.error || 'Step failed.'
                    : 'Step completed.'),
                error: step.error,
              }))
            : []),
        ],
        structuredData: {
          ...(agentResult.metadata?.structuredData || {}),
          ...(browserSearchContext.enabled
            ? {
                browser_search: {
                  enabled: browserSearchContext.enabled,
                  used: browserSearchContext.used,
                  mode: browserSearchContext.mode,
                  provider: browserSearchContext.provider,
                  query: browserSearchContext.query,
                  error: browserSearchContext.error,
                  results: browserSearchContext.results.slice(0, 6),
                },
              }
            : {}),
          ...(agentResult.metadata?.goal
            ? { goal_understanding: agentResult.metadata.goal }
            : {}),
          ...(agentResult.metadata?.responseMode
            ? { response_mode: agentResult.metadata.responseMode }
            : {}),
          response_mode: responseMode,
          ...(shouldAttachFinance
            ? { finance: normalizedFinance }
            : {}),
          ...(operatorAlertsStructured.length
            ? { operator_alerts: operatorAlertsStructured }
            : {}),
          attachments,
          memory_diagnostics: {
            candidatesEvaluated: memoryCandidates.length,
            storedCount: storedMemoryCount,
          },
        },
        suggestedActions: [
          ...(agentResult.metadata?.suggestedActions || []),
          ...(browserSearchContext.used && browserSearchContext.query
            ? buildBrowserSuggestedActions(browserSearchContext.query)
            : []),
        ],
        operatorResponse: buildOperatorResponse({
          answer: reply || SAFE_AGENT_FALLBACK.reply,
          metadata: {
            ...agentResult.metadata,
            plan: agentResult.metadata?.plan || 'Partial fallback',
            suggestedActions: [
              ...(agentResult.metadata?.suggestedActions || []),
              ...(browserSearchContext.used && browserSearchContext.query
                ? buildBrowserSuggestedActions(browserSearchContext.query)
                : []),
            ],
          },
          structuredData: {
            ...(agentResult.metadata?.structuredData || {}),
            ...(browserSearchContext.enabled
              ? {
                  browser_search: {
                    enabled: browserSearchContext.enabled,
                    used: browserSearchContext.used,
                    mode: browserSearchContext.mode,
                    provider: browserSearchContext.provider,
                    query: browserSearchContext.query,
                    error: browserSearchContext.error,
                    results: browserSearchContext.results.slice(0, 6),
                  },
                }
              : {}),
            ...(agentResult.metadata?.goal
              ? { goal_understanding: agentResult.metadata.goal }
              : {}),
            ...(agentResult.metadata?.responseMode
              ? { response_mode: agentResult.metadata.responseMode }
              : {}),
            response_mode: responseMode,
            ...(shouldAttachFinance
              ? { finance: normalizedFinance }
              : {}),
            ...(operatorAlertsStructured.length
              ? { operator_alerts: operatorAlertsStructured }
              : {}),
            attachments,
            memory_diagnostics: {
              candidatesEvaluated: memoryCandidates.length,
              storedCount: storedMemoryCount,
            },
          },
          responseMode,
        }),
        responseMode,
        memoryUsed:
          Boolean(agentResult.metadata?.memoryUsed) ||
          relevantMemories.length > 0,
        verificationPassed: !!agentResult.metadata?.verificationPassed,
        iterationCount: Array.isArray(agentResult.metadata?.steps)
          ? agentResult.metadata.steps.length
          : 0,
      },
      operatorResponse: buildOperatorResponse({
        answer: reply || SAFE_AGENT_FALLBACK.reply,
        metadata: {
          ...agentResult.metadata,
          plan: agentResult.metadata?.plan || 'Partial fallback',
          suggestedActions: [
            ...(agentResult.metadata?.suggestedActions || []),
            ...(browserSearchContext.used && browserSearchContext.query
              ? buildBrowserSuggestedActions(browserSearchContext.query)
              : []),
          ],
        },
        structuredData: {
          ...(agentResult.metadata?.structuredData || {}),
          ...(browserSearchContext.enabled
            ? {
                browser_search: {
                  enabled: browserSearchContext.enabled,
                  used: browserSearchContext.used,
                  mode: browserSearchContext.mode,
                  provider: browserSearchContext.provider,
                  query: browserSearchContext.query,
                  error: browserSearchContext.error,
                  results: browserSearchContext.results.slice(0, 6),
                },
              }
            : {}),
          ...(agentResult.metadata?.goal
            ? { goal_understanding: agentResult.metadata.goal }
            : {}),
          ...(agentResult.metadata?.responseMode
            ? { response_mode: agentResult.metadata.responseMode }
            : {}),
          response_mode: responseMode,
          ...(shouldAttachFinance
            ? { finance: normalizedFinance }
            : {}),
          ...(operatorAlertsStructured.length
            ? { operator_alerts: operatorAlertsStructured }
            : {}),
          attachments,
          memory_diagnostics: {
            candidatesEvaluated: memoryCandidates.length,
            storedCount: storedMemoryCount,
          },
        },
        responseMode,
      }),
      usage: {
        current: usageAfterRun.current,
        limit: usageAfterRun.limit,
        remaining: usageAfterRun.remaining,
        unlimited: usageAfterRun.unlimited,
        unlimitedReason: usageAfterRun.unlimitedReason,
        bonusAgentRuns: remainingBonusAgentRuns,
      },
      plan,
    };

    console.info('AGENT_ROUTE_SUCCESS', {
      requestId,
      durationMs: Date.now() - startedAt,
      intent: payload.metadata.intent,
      attachmentCount: attachments.length,
      storedMemoryCount,
      bonusAgentRuns: remainingBonusAgentRuns,
    });

    return safeJsonResponse(payload);
  } catch (error) {
    console.error('AGENT_ROUTE_ERROR', {
      requestId,
      durationMs: Date.now() - startedAt,
      error,
    });
    return safeJsonResponse(SAFE_AGENT_FALLBACK);
  }
}
