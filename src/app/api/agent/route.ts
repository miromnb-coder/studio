import { NextResponse } from 'next/server';
import { runAgentV7 } from '@/agent/v7/orchestrator';
import { initializeFirebase } from '@/firebase';
import { SubscriptionService, PLAN_LIMITS } from '@/services/subscription-service';
import type { AgentResponse, AgentResponseStep } from '@/types/agent-response';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @fileOverview JSON API Entry Point for Agent Engine v7.
 * Returns a stable AgentResponse shape for chat rendering.
 */

function summarizeStepOutput(output: Record<string, unknown>): string | undefined {
  if (typeof output.response === 'string') return output.response;
  if (typeof output.insights === 'string') return output.insights;
  if (typeof output.notes === 'string') return output.notes;
  if (Array.isArray(output.leaks)) return `${output.leaks.length} potential leaks found.`;
  return undefined;
}

export async function POST(req: Request) {
  try {
    const { input, history, imageUri, userId } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured.');
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
      return NextResponse.json({ error: 'No valid content provided.' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    if (userId && userId !== 'system_anonymous' && firestore) {
      const { plan, usage } = await SubscriptionService.getUserStatus(firestore, userId);

      const planKey = (plan || 'FREE').toUpperCase() as keyof typeof PLAN_LIMITS;
      const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.FREE;
      const limit = limits.dailyAgentRuns;

      if (usage.agentRuns >= limit) {
        return NextResponse.json(
          {
            error: 'LIMIT_REACHED',
            message: 'Daily intelligence quota exceeded.',
            usage: { ...usage, limit },
          },
          { status: 403 },
        );
      }

      await SubscriptionService.incrementUsage(firestore, userId);
    }

    const { stream, metadata, steps, structuredData } = await runAgentV7(
      safeInput || 'Continue',
      userId || 'system_anonymous',
      safeHistory,
      imageUri,
    );

    let reply = '';
    if (stream) {
      for await (const chunk of stream) {
        reply += (chunk as any).choices?.[0]?.delta?.content || '';
      }
    }

    const mappedSteps: AgentResponseStep[] = steps.map((step) => ({
      action: step.tool,
      status: step.status === 'success' ? 'completed' : 'failed',
      summary: summarizeStepOutput(step.output),
      error: step.error,
    }));

    const payload: AgentResponse = {
      reply: reply || 'Analysis finalized.',
      metadata: {
        intent: metadata.intent || 'general',
        plan: metadata.planSummary || 'No plan available.',
        steps: mappedSteps,
        structuredData,
        memoryUsed: metadata.memoryUsed,
        iterationCount: steps.length,
      },
    };

    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
