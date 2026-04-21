import crypto from 'node:crypto';
import { runAgentVNext } from '@/agent/vNext/orchestrator';
import type { ResponseMode } from '@/agent/types/response-mode';
import type { AgentExecutionPayload } from '@/types/agent-response';
import type { AgentRouteInput, CompatibleAgentResponse } from './route-helpers';

function toExecutionIntent(intent: string | undefined): AgentExecutionPayload['intent'] {
  if (intent === 'gmail') return 'email';
  if (intent === 'memory') return 'memory';
  if (intent === 'compare' || intent === 'shopping' || intent === 'research') return 'browser';
  return 'general';
}

function buildExecutionMetadata(params: {
  intent: string | undefined;
  planSummary: string;
  toolResults: unknown[];
  steps: Array<{ id: string; title: string; status: string }>;
}): AgentExecutionPayload {
  const failedStepIds = params.steps
    .filter((step) => step.status === 'failed')
    .map((step) => step.id);
  const doneStepIds = params.steps
    .filter((step) => step.status === 'completed' || step.status === 'skipped')
    .map((step) => step.id);
  const activeStep = params.steps.find((step) => step.status === 'running');

  return {
    intent: toExecutionIntent(params.intent),
    forceMode:
      params.toolResults.length > 0 || params.steps.length > 0 ? 'execution' : 'status',
    statusText: params.planSummary || 'Planning response',
    activeStepId: activeStep?.id,
    doneStepIds,
    errorStepIds: failedStepIds,
    toolCount: params.toolResults.length,
  };
}

export async function runNewAgent(
  input: AgentRouteInput,
): Promise<CompatibleAgentResponse | null> {
  const responseModeHint =
    typeof input.productState?.responseModeHint === 'string'
      ? (input.productState.responseModeHint as ResponseMode)
      : 'operator';

  let result;
  try {
    result = await runAgentVNext({
      requestId: crypto.randomUUID(),
      userId: input.userId,
      message: input.input,
      conversation: (input.history || [])
        .filter(
          (
            message,
          ): message is { role: 'system' | 'user' | 'assistant'; content: string } =>
            !!message &&
            typeof message === 'object' &&
            (message as { role?: unknown }).role !== undefined &&
            ((message as { role?: unknown }).role === 'system' ||
              (message as { role?: unknown }).role === 'user' ||
              (message as { role?: unknown }).role === 'assistant') &&
            typeof (message as { content?: unknown }).content === 'string',
        )
        .map((message, index) => ({
          id: `history-${index}`,
          role: message.role,
          content: message.content,
        })),
      metadata: {
        productState: input.productState,
        gmailConnected: Boolean(input.productState?.gmailConnected),
        calendarConnected: Boolean(input.productState?.calendarConnected),
        memory: input.memory || null,
        operatorAlerts: input.operatorAlerts || [],
        outcomes: input.outcomes || [],
        userProfileIntelligence: input.userProfileIntelligence || null,
        userIntelligenceSummary: input.userIntelligenceSummary || '',
        attachments: input.attachments || [],
        attachmentCount: input.attachments?.length || 0,
        responseModeHint,
      },
    });
  } catch (error) {
    console.error('RUN_NEW_AGENT_VNEXT_THROW', {
      userId: input.userId,
      error,
    });
    return null;
  }

  if (!result.ok || !result.response) {
    return null;
  }

  const response = result.response;
  const answer = response.answer;
  const route = response.route;
  const plan = response.plan;
  const evaluation = response.evaluation;
  const memory = response.memory;
  const toolResults = Array.isArray(response.toolResults) ? response.toolResults : [];
  const execution = buildExecutionMetadata({
    intent: route.intent,
    planSummary: plan.summary,
    toolResults,
    steps: plan.steps,
  });

  const mergedStructuredData = {
    ...(answer.structuredData && typeof answer.structuredData === 'object'
      ? answer.structuredData
      : {}),
    route,
    toolResults,
    evaluation: evaluation || null,
    memory: memory || null,
    attachments: input.attachments || [],
    structuredAnswer: answer.structured,
    execution,
  };

  return {
    reply: answer.text,
    metadata: {
      intent: route.intent || 'general',
      subtype: route.intent || 'none',
      mode:
        route.intent === 'finance'
          ? 'finance'
          : route.intent === 'gmail'
            ? 'gmail'
            : route.intent === 'productivity' || route.intent === 'planning'
              ? 'productivity'
              : route.intent === 'coding'
                ? 'coding'
                : route.intent === 'memory'
                  ? 'memory'
                  : 'general',
      responseMode:
        (answer.metadata?.responseMode as ResponseMode | undefined) ||
        (answer.metadata?.mode as ResponseMode | undefined) ||
        responseModeHint,
      goal: {
        explicitRequest: input.input,
        hiddenRequest: '',
        inferredGoal:
          route.userGoal ||
          route.reason ||
          'Provide a helpful response.',
        interpretationConfidence:
          typeof route.confidence === 'number' && route.confidence >= 0.8
            ? 'high'
            : typeof route.confidence === 'number' && route.confidence >= 0.55
              ? 'medium'
              : 'low',
        urgency: 'medium',
        complexityLevel:
          plan.steps.length >= 6 ? 'high' : plan.steps.length >= 3 ? 'medium' : 'low',
        blockerLevel: 'none',
        riskLevel: 'low',
        effortTolerance: 'medium',
        speedVsDepth:
          route.suggestedExecutionMode === 'stream' ? 'depth' : 'balanced',
        decisionType:
          route.intent === 'compare' || route.intent === 'shopping'
            ? 'decision'
            : 'informational',
        requestKind:
          route.intent === 'shopping'
            ? 'recommendation'
            : route.intent === 'compare'
              ? 'comparison'
              : route.intent === 'planning' || route.intent === 'productivity'
                ? 'planning'
                : 'advice',
        userConfidenceLevel: 'medium',
        horizon: 'short_term',
        preferredStyle:
          responseModeHint === 'casual'
            ? 'simple'
            : responseModeHint === 'fast'
              ? 'concise'
              : 'structured',
        category: route.intent || 'general',
        hiddenOpportunities: [],
        clarificationNeeded: false,
        wantsImmediateNextStep: true,
        emotionalTone: 'neutral',
        inputLanguage: route.inputLanguage || 'unknown',
        responseLanguage: route.responseLanguage || route.inputLanguage || 'en',
      },
      plan: plan.summary,
      planModes: [route.suggestedExecutionMode === 'stream' ? 'deep' : 'recommend'],
      steps: plan.steps.map((step) => ({
        stepId: step.id,
        title: step.title,
        action: step.title,
        tool: step.requiredTool,
        status:
          step.status === 'failed'
            ? 'failed'
            : step.status === 'skipped'
              ? 'skipped'
              : step.status === 'running'
                ? 'running'
                : 'completed',
        summary: step.description,
        input: step.input || {},
        output: {},
      })),
      structuredData: mergedStructuredData,
      execution,
      suggestedActions: Array.isArray(answer.followUps)
        ? answer.followUps.map((item, index) => ({
            id: `followup-${index + 1}`,
            label: String(item),
            kind: 'general',
          }))
        : [],
      memoryUsed: Array.isArray(memory.items) ? memory.items.length > 0 : false,
      verificationPassed: evaluation?.passed ?? true,
      critic: {
        criticScore: evaluation?.score ?? 80,
        passed: evaluation?.passed ?? true,
        needsRewrite: false,
        qualityNotes: response.warnings || [],
      },
      state: 'responding',
    },
    operatorResponse: {
      answer: answer.text,
      nextStep: answer.structured?.nextStep || plan.steps[0]?.title,
      decisionBrief: plan.summary,
      opportunity:
        typeof mergedStructuredData.opportunity === 'string'
          ? mergedStructuredData.opportunity
          : undefined,
      risk:
        typeof mergedStructuredData.risk === 'string'
          ? mergedStructuredData.risk
          : undefined,
    },
  };
}
