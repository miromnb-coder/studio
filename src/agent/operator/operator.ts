import type { ChatMessage } from '@/lib/ai/types';
import { routeIntent } from './intent-router';
import { retrieveMemory, storeMemory } from './memory-agent';
import { runAnalysisAgent, runPlanningStep, runResearchAgent, runResponseAgent } from './sub-agents';
import type { OperatorContext, OperatorResult } from './types';

function runStep(context: OperatorContext, label: string, fn: () => Promise<void>) {
  return (async () => {
    context.emitStep({ label, status: 'running' });
    await fn();
    context.emitStep({ label, status: 'completed' });
  })();
}

export async function runOperatorPipeline(
  provider: OperatorContext['provider'],
  messages: ChatMessage[],
  sessionId: string,
  emitStep: OperatorContext['emitStep'],
): Promise<OperatorResult> {
  const latestUserInput = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const route = routeIntent(latestUserInput);

  const context: OperatorContext = { provider, messages, latestUserInput, route, emitStep };

  let memoryUsed: ReturnType<typeof retrieveMemory> = [];
  let planningOutput = '';
  let researchOutput = '';
  let analysisOutput = '';

  await runStep(context, 'Understanding your request', async () => {
    // Intent routing already computed.
  });

  if (route.needsMemory) {
    await runStep(context, 'Checking relevant memory', async () => {
      memoryUsed = retrieveMemory(sessionId, latestUserInput);
    });
  }

  if (route.needsPlanning) {
    await runStep(context, 'Planning the best response', async () => {
      planningOutput = await runPlanningStep(provider, latestUserInput, route, memoryUsed);
    });
  }

  if (route.needsResearch) {
    await runStep(context, 'Researching key details', async () => {
      researchOutput = await runResearchAgent(provider, latestUserInput, messages);
    });
  }

  if (route.needsAnalysis) {
    await runStep(context, 'Analyzing options and tradeoffs', async () => {
      analysisOutput = await runAnalysisAgent(provider, latestUserInput, researchOutput, memoryUsed, planningOutput);
    });
  }

  let final = '';
  await runStep(context, 'Composing your final answer', async () => {
    final = await runResponseAgent(provider, latestUserInput, {
      route,
      research: researchOutput,
      analysis: analysisOutput,
      memory: memoryUsed,
      plan: planningOutput,
    });
  });

  let stored: OperatorResult['memoryStored'] = [];
  await runStep(context, 'Saving useful context for next time', async () => {
    stored = storeMemory(sessionId, latestUserInput, final);
  });

  return {
    final,
    route,
    memoryUsed,
    memoryStored: stored,
  };
}
