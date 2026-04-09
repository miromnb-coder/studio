import { NextResponse } from 'next/server';
import { runAgentV7 } from '@/agent/v7/orchestrator';
import { initializeFirebase } from '@/firebase';
import { SubscriptionService, PLAN_LIMITS } from '@/services/subscription-service';
import type { AgentResponse } from '@/types/agent-response';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function collectStreamToText(stream: AsyncIterable<any> | null | undefined): Promise<string> {
  if (!stream) return '';

  let finalText = '';

  for await (const chunk of stream as any) {
    const content = chunk?.choices?.[0]?.delta?.content || '';
    if (content) {
      finalText += content;
    }
  }

  return finalText.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input, history, imageUri, userId } = body ?? {};

    if (!userId || userId === 'system_anonymous') {
      return NextResponse.json(
        {
          error: 'AUTH_REQUIRED',
          message: 'Please sign in to use chat.',
        },
        { status: 401 },
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured.' }, { status: 500 });
    }

    const safeHistory = (history || [])
      .filter((m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m: any) => ({
        role: m.role || 'user',
        content: m.content.trim(),
      }));

    const safeInput = typeof input === 'string' && input.trim().length > 0 ? input.trim() : imageUri ? '[Analyze visual data]' : null;

    if (!safeInput && safeHistory.length === 0) {
      return NextResponse.json({ error: 'No valid content provided.' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    if (!firestore) {
      return NextResponse.json({ error: 'FIRESTORE_UNAVAILABLE' }, { status: 500 });
    }

    const { plan, usage } = await SubscriptionService.getUserStatus(firestore, userId);

    const planKey = (plan || 'FREE').toUpperCase() as keyof typeof PLAN_LIMITS;
    const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.FREE;
    const limit = limits.dailyAgentRuns;

    if (usage.agentRuns >= limit) {
      return NextResponse.json(
        {
          error: 'LIMIT_REACHED',
          message: 'Daily limit reached',
          usage: { current: usage.agentRuns, limit, remaining: 0 },
          plan,
        },
        { status: 403 },
      );
    }

    const { stream, metadata, steps, structuredData } = await runAgentV7(safeInput || 'Continue', userId, safeHistory, imageUri);

    const reply = await collectStreamToText(stream);
    const updatedUsage = await SubscriptionService.incrementUsage(firestore, userId);

    const payload: AgentResponse & { usage: { current: number; limit: number; remaining: number }; plan: string } = {
      reply: reply || 'Analysis finalized.',
      metadata: {
        intent: metadata?.intent || 'general',
        plan: metadata?.planSummary || 'No plan available.',
        steps: Array.isArray(steps)
          ? steps.map((step) => ({
              action: `${step.tool}: ${step.reason}`,
              status: step.status === 'error' ? 'failed' : 'completed',
              summary: step.reason,
              error: step.error,
            }))
          : [],
        structuredData: structuredData ?? undefined,
        memoryUsed: !!metadata?.memoryUsed,
        iterationCount: Array.isArray(steps) ? steps.length : 0,
      },
      usage: {
        current: updatedUsage.agentRuns,
        limit,
        remaining: Math.max(limit - updatedUsage.agentRuns, 0),
      },
      plan,
    };

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('AGENT_ROUTE_ERROR:', error);

    const fallback: AgentResponse = {
      reply: 'Something went wrong while processing your request.',
      metadata: {
        intent: 'general',
        plan: 'Fallback response',
        steps: [],
        structuredData: undefined,
        memoryUsed: false,
        iterationCount: 0,
      },
    };

    return NextResponse.json(fallback, { status: 200 });
  }
}
