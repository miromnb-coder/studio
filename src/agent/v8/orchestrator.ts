import { runFinanceAgent, runMemoryAgent, runResearchAgent } from './agents';
import { buildContextV8 } from './context';
import { executePlanV8 } from './executor';
import { createPlanV8 } from './planner';
import { routeIntentV8 } from './router';
import { synthesizeResponseV8 } from './synthesizer';
import { AgentResponseV8, AgentRunInputV8, SystemStateV8 } from './types';
import { verifyExecutionV8 } from './verifier';

function buildSafeFallbackReply(input: {
  userMessage: string;
  intent: string;
  clarificationQuestion?: string;
}): string {
  const { intent, clarificationQuestion } = input;

  if (intent === 'finance') {
    return [
      'Observation: You want a concrete financial move, but current evidence is still partial.',
      'Interpretation: The main blocker is not options—it is missing numeric grounding for prioritization.',
      'Next focus: Add one monthly cost, bill, or subscription so I can rank actions accurately.',
      'Recommendation: Start with the highest recurring pressure item before broader budget changes.',
      'Action steps:',
      '- Share one recurring charge or monthly spending target.',
      '- Ask for a subscription audit or savings plan.',
      '- Add Gmail or finance evidence if you want deeper analysis.',
      'Confidence: Low (the system did not have enough validated evidence to produce a strong financial recommendation).',
      clarificationQuestion
        ? `Question: ${clarificationQuestion}`
        : 'Question: What is one concrete number I should optimize around?',
      'Next Step: Send one bill, subscription, or monthly target and I will turn it into a more precise action plan.',
    ].join('\n');
  }

  return clarificationQuestion
    ? `Observation: I need one concrete detail to give a precise answer.\nNext focus: ${clarificationQuestion}`
    : 'Observation: I need one concrete detail to give a precise answer.';
}

export async function runAgentV8(input: AgentRunInputV8): Promise<AgentResponseV8> {
  let state: SystemStateV8 = 'idle';

  state = 'understanding';
  const route = routeIntentV8(input.input, (input.history || []) as any);

  const context = await buildContextV8({
    supabase: input.supabase,
    userId: input.userId,
    message: input.input,
    history: input.history,
    memory: input.memory,
    route,
    productState: input.productState,
    operatorAlerts: input.operatorAlerts,
    outcomes: input.outcomes,
    userProfileIntelligence: input.userProfileIntelligence || null,
  });

  state = 'planning';
  const plan = createPlanV8(route, input.input);

  state = 'executing';
  const execution = await executePlanV8(plan, context).catch((error) => {
    console.error('PLAN_EXECUTION_FAILURE', {
      intent: route.intent,
      subtype: route.subtype,
      error: error instanceof Error ? error.message : 'Unknown execution failure',
    });
    return { steps: [], structuredData: {}, partialSuccess: false };
  });

  let draftReply = '';

  try {
    if (route.intent === 'finance') {
      const financeOutput = await runFinanceAgent({ route, context, plan, execution });
      draftReply = financeOutput.answerDraft;
    } else {
      const researchOutput = await runResearchAgent({ route, context, execution });
      draftReply = researchOutput.answerDraft;
    }
  } catch (error) {
    console.error('AGENT_SPECIALIST_FAILURE', {
      intent: route.intent,
      subtype: route.subtype,
      error: error instanceof Error ? error.message : 'Unknown specialist failure',
    });

    draftReply = buildSafeFallbackReply({
      userMessage: input.input,
      intent: route.intent,
      clarificationQuestion: plan.clarificationQuestion,
    });
  }

  const critic = verifyExecutionV8({
    userMessage: input.input,
    intent: route.intent,
    reply: draftReply,
    usedTools: execution.steps.filter((s) => s.status === 'completed').map((s) => s.tool),
    plan,
    structuredData: execution.structuredData,
  });

  const finalReply =
    critic.refinedReply && critic.refinedReply.trim().length > 0
      ? critic.refinedReply.trim()
      : buildSafeFallbackReply({
          userMessage: input.input,
          intent: route.intent,
          clarificationQuestion: plan.clarificationQuestion,
        });

  const safeReply =
    route.intent === 'finance' && finalReply.split(/\s+/).length < 18
      ? buildSafeFallbackReply({
          userMessage: input.input,
          intent: route.intent,
          clarificationQuestion: plan.clarificationQuestion,
        })
      : finalReply;

  await runMemoryAgent({
    supabase: input.supabase,
    userId: input.userId,
    userMessage: input.input,
    assistantReply: safeReply,
    context,
    intent: route.intent,
  }).catch((error) => {
    console.error('MEMORY_AGENT_FAILURE', {
      userId: input.userId,
      intent: route.intent,
      error: error instanceof Error ? error.message : 'Unknown memory failure',
    });
    return { stored: [] };
  });

  state = 'responding';
  const response = synthesizeResponseV8({
    route,
    plan,
    execution,
    context,
    verificationPassed: critic.passed,
    refinedReply: safeReply,
    critic,
  });

  return {
    ...response,
    metadata: {
      ...response.metadata,
      state,
    },
  };
}
