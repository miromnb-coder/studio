import { runFinanceAgent, runMemoryAgent, runResearchAgent } from './agents';
import { buildContextV8 } from './context';
import { executePlanV8 } from './executor';
import { createPlanV8 } from './planner';
import { routeIntentV8 } from './router';
import { synthesizeResponseV8 } from './synthesizer';
import { AgentResponseV8, AgentRunInputV8, SystemStateV8 } from './types';
import { verifyExecutionV8 } from './verifier';

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
    userProfileIntelligence: input.userProfileIntelligence || null,
  });

  state = 'planning';
  const plan = createPlanV8(route, input.input);

  state = 'executing';
  const execution = await executePlanV8(plan, context);

  let draftReply = '';

  if (route.intent === 'finance') {
    const financeOutput = await runFinanceAgent({ route, context, plan, execution });
    draftReply = financeOutput.answerDraft;
  } else {
    const researchOutput = await runResearchAgent({ route, context, execution });
    draftReply = researchOutput.answerDraft;
  }

  const critic = verifyExecutionV8({
    userMessage: input.input,
    intent: route.intent,
    reply: draftReply,
    usedTools: execution.steps.filter((s) => s.status === 'completed').map((s) => s.tool),
    plan,
    structuredData: execution.structuredData,
  });

  await runMemoryAgent({
    supabase: input.supabase,
    userId: input.userId,
    userMessage: input.input,
    assistantReply: critic.refinedReply,
    context,
    intent: route.intent,
  }).catch(() => ({ stored: [] }));

  state = 'responding';
  const response = synthesizeResponseV8({
    route,
    plan,
    execution,
    context,
    verificationPassed: critic.passed,
    refinedReply: critic.refinedReply,
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
