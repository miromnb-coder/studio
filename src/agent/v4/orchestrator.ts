
import { routeIntent } from './router';
import { createPlan } from './planner';
import { executeTools } from './tools';
import { evaluateResponse } from './critic';
import { generateResponse } from './generator';
import { reflectOnInteraction } from './reflection';
import { AgentContext, Intent } from './types';

/**
 * @fileOverview Orchestrator Agent: Main loop for Agent v4.1 architecture.
 */

async function checkFastPath(input: string): Promise<string | null> {
  const lower = input.toLowerCase();
  if (lower.length < 10 && (lower.includes('hi') || lower.includes('hello') || lower.includes('status'))) {
    return "Operator v4.1 online. Neural pathways active.";
  }
  return null;
}

export async function runAgentV4(input: string, history: any[] = [], memory: any = null, imageUri?: string): Promise<any> {
  // 1. Fast Path
  const fastPathResponse = await checkFastPath(input);
  if (fastPathResponse) {
    return {
      content: fastPathResponse,
      intent: 'general',
      fastPathUsed: true,
      mode: 'general'
    };
  }

  // 2. Routing
  const { intent, language } = await routeIntent(input, history);

  // 3. Planning
  const plan = await createPlan(input, intent, history);

  // 4. Tools
  const toolResults = await executeTools(plan, input, imageUri);

  // 5. Context Building
  const context: AgentContext = {
    input,
    history,
    memory,
    imageUri,
    intent,
    language,
    plan,
    toolResults,
    fastPathUsed: false
  };

  // 6. Generation & Criticism Loop
  let response = await generateResponse(context);
  let feedback = await evaluateResponse(input, response);
  
  if (feedback.needs_revision) {
    context.criticFeedback = feedback;
    response = await generateResponse(context, 2);
    feedback = await evaluateResponse(input, response);
  }

  context.finalResponse = response;
  context.criticFeedback = feedback;

  // 7. Reflection (Async)
  reflectOnInteraction(context).catch(console.error);

  return {
    content: response.summary || '',
    intent,
    plan,
    toolOutputs: toolResults,
    critic: feedback,
    isActionable: !!response.isActionable,
    mode: response.mode || intent,
    fastPathUsed: false,
    data: {
      ...response,
      ...response.data
    }
  };
}
