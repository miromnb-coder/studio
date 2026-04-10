import { buildContextV8 } from './context';
import { executePlanV8 } from './executor';
import { createPlanV8 } from './planner';
import { routeIntentV8 } from './router';
import { synthesizeResponseV8 } from './synthesizer';
import { AgentResponseV8, AgentRunInputV8 } from './types';
import { verifyExecutionV8 } from './verifier';

export async function runAgentV8(input: AgentRunInputV8): Promise<AgentResponseV8> {
  const route = routeIntentV8(input.input, (input.history || []) as any);

  const context = buildContextV8({
    userId: input.userId,
    message: input.input,
    history: input.history,
    memory: input.memory,
    route,
    productState: input.productState,
  });

  const plan = createPlanV8(route, input.input);
  const execution = await executePlanV8(plan, context);
  const verification = verifyExecutionV8(route.intent, execution);

  const normalizedExecution = {
    ...execution,
    structuredData: verification.correctedStructuredData,
  };

  return synthesizeResponseV8({
    route,
    plan,
    execution: normalizedExecution,
    context,
    verificationPassed: verification.passed,
  });
}
