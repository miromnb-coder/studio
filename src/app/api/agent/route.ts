import { NextResponse } from 'next/server';
import { runAgentV7 } from '@/agent/v7/orchestrator';
import { initializeFirebase } from '@/firebase';
import { SubscriptionService, PLAN_LIMITS } from '@/services/subscription-service';
import type { AgentResponse } from '@/types/agent-response';
import { normalizeFinanceAnalysis, runFinanceAction, safeFinanceActionFallback } from '@/lib/finance/normalize';
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

const SAFE_AGENT_FALLBACK: AgentResponse = {
  reply: 'I ran into an issue, but here’s what I could analyze so far.',
  metadata: {
    intent: 'general',
    plan: 'Partial fallback',
    steps: [],
    structuredData: null,
    memoryUsed: false,
    iterationCount: 0,
  },
};

async function collectStreamToText(stream: AsyncIterable<any> | null | undefined): Promise<string> {
  if (!stream) return '';

  let finalText = '';

  try {
    for await (const chunk of stream as any) {
      const content = chunk?.choices?.[0]?.delta?.content || '';
      if (content) {
        finalText += content;
      }
    }
  } catch (error) {
    console.error('AGENT_STREAM_COLLECT_ERROR:', error);
  }

  return finalText.trim();
}

function safeJsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

function parseActionType(raw: unknown): FinanceActionType | null {
  if (raw === 'create_savings_plan' || raw === 'find_alternatives' || raw === 'draft_cancellation') {
    return raw;
  }
  return null;
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

    const { firestore } = initializeFirebase();
    if (!firestore) {
      console.error('AGENT_ROUTE_FIRESTORE_UNAVAILABLE');
      return safeJsonResponse(SAFE_AGENT_FALLBACK);
    }

    const { plan, usage } = await SubscriptionService.getUserStatus(firestore, userId);

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

    const planKey = (plan || 'FREE').toUpperCase() as keyof typeof PLAN_LIMITS;
    const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.FREE;
    const limit = limits.dailyAgentRuns;

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

    const safeHistory = (history || [])
      .filter((m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m: any) => ({
        role: m.role || 'user',
        content: m.content.trim(),
      }));

    const safeInput = typeof input === 'string' && input.trim().length > 0 ? input.trim() : imageUri ? '[Analyze visual data]' : null;

    if (!safeInput && safeHistory.length === 0) {
      return safeJsonResponse({ error: 'No valid content provided.' }, 400);
    }

    const supabase = await createSupabaseServerClient().catch((error) => {
      console.error('SUPABASE_SERVER_CLIENT_ERROR:', error);
      return null;
    });

    const memoryIntent = await detectMemoryIntent(safeInput || 'Continue');
    const fallbackMemory: RetrievedMemoryContext = {
      userId,
      summaryType: memoryIntent,
      summary: 'No prior context available.',
    };

    const retrievedMemory: RetrievedMemoryContext =
      supabase && userId
        ? await retrieveRelevantMemory(supabase, userId, memoryIntent).catch((error) => {
            console.error('MEMORY_RETRIEVAL_ERROR:', error);
            return fallbackMemory;
          })
        : fallbackMemory;

    console.info('AGENT_ROUTE_ORCHESTRATOR_START', { userId, hasImage: Boolean(imageUri), historyCount: safeHistory.length });
    const agentResult = await runAgentV7(safeInput || 'Continue', userId, safeHistory, imageUri, retrievedMemory).catch((error) => {
      console.error('AGENT_V7_EXECUTION_ERROR:', error);
      return null;
    });
    console.info('AGENT_ROUTE_ORCHESTRATOR_DONE', {
      ok: Boolean(agentResult),
      intent: agentResult?.metadata?.intent || 'unknown',
      stepCount: agentResult?.steps?.length || 0,
    });

    const normalizedFinance = normalizeFinanceAnalysis(agentResult?.structuredData);
    const shouldAttachFinance =
      agentResult?.metadata?.intent === 'finance' ||
      Boolean((agentResult?.structuredData || {}).detect_leaks) ||
      Boolean(actionType);
    const updatedUsage = await SubscriptionService.incrementUsage(firestore, userId).catch((error) => {
      console.error('USAGE_INCREMENT_ERROR:', error);
      return usage;
    });

    if (actionType) {
      const actionResult = runFinanceAction(actionType, normalizedFinance);
      if (supabase) {
        const extracted = await extractImportantMemory({
          intent: memoryIntent,
          userInput: safeInput || '',
          assistantReply: actionResult.summary,
          finance: normalizedFinance,
          actionType,
        });
        await persistSmartMemory(supabase, userId, extracted, retrievedMemory.financeProfile).catch((error) => {
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
            actionResult: actionResult.type === 'error' ? safeFinanceActionFallback() : actionResult,
          },
          memoryUsed: false,
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
    const streamedReply = await collectStreamToText(agentResult?.stream);
    const reply = streamedReply || agentResult?.finalText || '';
    console.info('AGENT_ROUTE_RESPONSE_SYNTHESIS_DONE', { hasReply: reply.trim().length > 0 });

    if (supabase && reply.trim().length > 0) {
      const extracted = await extractImportantMemory({
        intent: memoryIntent,
        userInput: safeInput || '',
        assistantReply: reply,
        finance: normalizedFinance,
        actionType: null,
      });

      await persistSmartMemory(supabase, userId, extracted, retrievedMemory.financeProfile).catch((error) => {
        console.error('SMART_MEMORY_PERSIST_ERROR:', error);
      });
    }

    const payload: AgentResponse & { usage: { current: number; limit: number; remaining: number }; plan: string } = {
      reply: reply || 'I ran into an issue, but here’s what I could analyze so far.',
      metadata: {
        intent: agentResult?.metadata?.intent || 'general',
        plan: agentResult?.metadata?.planSummary || 'Partial fallback',
        steps: Array.isArray(agentResult?.steps)
          ? agentResult!.steps.map((step) => ({
              action: `${step.tool}: ${step.reason}`,
              status: step.status === 'error' ? 'failed' : 'completed',
              summary: step.reason,
              error: step.error,
            }))
          : [],
        structuredData: {
          ...(agentResult?.structuredData || {}),
          ...(shouldAttachFinance ? { finance: normalizedFinance } : {}),
        },
        memoryUsed: !!agentResult?.metadata?.memoryUsed,
        iterationCount: Array.isArray(agentResult?.steps) ? agentResult.steps.length : 0,
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
