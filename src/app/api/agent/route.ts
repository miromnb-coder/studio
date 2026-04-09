import { runAgentV7 } from '@/agent/v7/orchestrator';
import { initializeFirebase } from '@/firebase';
import { SubscriptionService, PLAN_LIMITS } from '@/services/subscription-service';
import type { AgentResponse, AgentResponseMetadata, AgentResponseStep } from '@/types/agent-response';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function fallbackAgentResponse(message = 'Something went wrong while processing your request.'): AgentResponse {
  return {
    reply: message,
    metadata: {
      intent: 'general',
      plan: 'Fallback response',
      steps: [],
      structuredData: null,
      memoryUsed: false,
      iterationCount: 0,
    },
  };
}

function sanitizeStructuredData(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== 'object') return null;
  try {
    return JSON.parse(JSON.stringify(input)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function summarizeStepOutput(output: Record<string, unknown>): string | undefined {
  if (typeof output.response === 'string') return output.response;
  if (typeof output.insights === 'string') return output.insights;
  if (typeof output.notes === 'string') return output.notes;
  if (Array.isArray(output.leaks)) return `${output.leaks.length} potential leaks found.`;
  return undefined;
}

function normalizeMetadata(metadata: Partial<AgentResponseMetadata> | undefined): AgentResponseMetadata {
  return {
    intent: metadata?.intent ?? 'general',
    plan: metadata?.plan ?? 'Fallback response',
    steps: Array.isArray(metadata?.steps) ? metadata!.steps : [],
    structuredData: metadata?.structuredData ?? null,
    memoryUsed: metadata?.memoryUsed ?? false,
    iterationCount: metadata?.iterationCount ?? 0,
  };
}

function normalizeAgentResponse(input: Partial<AgentResponse> | null | undefined): AgentResponse {
  return {
    reply: typeof input?.reply === 'string' && input.reply.trim().length > 0 ? input.reply : 'Analysis finalized.',
    metadata: normalizeMetadata(input?.metadata),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input, history, imageUri, userId } = body ?? {};

    console.log('[AGENT_API] Incoming request', {
      userId: userId || 'system_anonymous',
      hasImage: Boolean(imageUri),
      inputPreview: typeof input === 'string' ? input.slice(0, 120) : null,
    });

    if (!process.env.GROQ_API_KEY) {
      console.error('[AGENT_API] Missing GROQ_API_KEY');
      return new Response(JSON.stringify(fallbackAgentResponse()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter((m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0)
          .map((m: any) => ({ role: m.role || 'user', content: m.content.trim() }))
      : [];

    const safeInput =
      typeof input === 'string' && input.trim().length > 0
        ? input.trim()
        : imageUri
          ? '[Analyze visual data]'
          : 'Please help with this request.';

    const { firestore } = initializeFirebase();

    if (userId && userId !== 'system_anonymous' && firestore) {
      try {
        const { plan, usage } = await SubscriptionService.getUserStatus(firestore, userId);
        const planKey = (plan || 'FREE').toUpperCase() as keyof typeof PLAN_LIMITS;
        const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.FREE;
        const limit = limits.dailyAgentRuns;

        if (usage.agentRuns >= limit) {
          return new Response(
            JSON.stringify({
              reply: 'Daily intelligence quota exceeded. Please try again tomorrow or upgrade your plan.',
              metadata: {
                intent: 'general',
                plan: 'Quota guardrail response',
                steps: [],
                structuredData: null,
                memoryUsed: false,
                iterationCount: 0,
              },
            } satisfies AgentResponse),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }

        await SubscriptionService.incrementUsage(firestore, userId);
      } catch (subscriptionError) {
        console.error('[AGENT_API] Subscription check failed:', subscriptionError);
      }
    }

    const { stream, metadata, steps, structuredData } = await runAgentV7(
      safeInput,
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

    const mappedSteps: AgentResponseStep[] = Array.isArray(steps)
      ? steps.map((step) => ({
          action: step.tool,
          status: step.status === 'success' ? 'completed' : 'failed',
          summary: summarizeStepOutput(step.output),
          error: step.error,
        }))
      : [];

    const payload = normalizeAgentResponse({
      reply,
      metadata: {
        intent: metadata?.intent || 'general',
        plan: metadata?.planSummary || 'No plan available.',
        steps: mappedSteps,
        structuredData: sanitizeStructuredData(structuredData),
        memoryUsed: Boolean(metadata?.memoryUsed),
        iterationCount: Array.isArray(steps) ? steps.length : 0,
      },
    });

    console.log('[AGENT_API] Agent output', {
      intent: payload.metadata.intent,
      plan: payload.metadata.plan,
      steps: payload.metadata.steps.length,
      hasStructuredData: Boolean(payload.metadata.structuredData),
      replyLength: payload.reply.length,
    });

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Agent API error:', error);

    return new Response(JSON.stringify(fallbackAgentResponse()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
