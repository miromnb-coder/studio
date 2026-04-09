import type { ChatMessage } from '@/lib/ai/types';
import type { AgentName } from '@/app/store/app-store';
import { routeIntent } from './intent-router';
import { retrieveMemory, storeMemory } from './memory-agent';
import { runAnalysisAgent, runResearchAgent, runResponseAgent } from './sub-agents';
import type { OperatorContext, OperatorResult } from './types';

function toAgentLabel(label: string): AgentName | undefined {
  if (label.includes('Research')) return 'Research Agent';
  if (label.includes('Analysis')) return 'Analysis Agent';
  if (label.includes('Memory')) return 'Memory Agent';
  if (label.includes('Response')) return 'Response Agent';
  return 'Supervisor Agent';
}

function runStep(context: OperatorContext, label: string, fn: () => Promise<void>) {
  return (async () => {
    context.emitStep({ label, status: 'running', agent: toAgentLabel(label) });
    await fn();
    context.emitStep({ label, status: 'completed', agent: toAgentLabel(label) });
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
  let researchOutput = '';
  let analysisOutput = '';

  await runStep(context, 'Supervisor: Understanding request...', async () => {
    // Intent routing computed above.
  });

  if (route.needsMemory) {
    await runStep(context, 'Memory Agent: Checking memory...', async () => {
      memoryUsed = retrieveMemory(sessionId, latestUserInput);
    });
  }

  if (route.needsResearch) {
    await runStep(context, 'Research Agent: Researching...', async () => {
      researchOutput = await runResearchAgent(provider, latestUserInput, messages);
    });
  }

  if (route.needsAnalysis) {
    await runStep(context, 'Analysis Agent: Analyzing...', async () => {
      analysisOutput = await runAnalysisAgent(provider, latestUserInput, researchOutput, memoryUsed);
    });
  }

  let final = '';
  await runStep(context, 'Response Agent: Generating final response...', async () => {
    final = await runResponseAgent(provider, latestUserInput, {
      research: researchOutput,
      analysis: analysisOutput,
      memory: memoryUsed,
      complexity: route.complexity,
    });
  });

  let stored: OperatorResult['memoryStored'] = [];
  await runStep(context, 'Memory Agent: Storing useful memory...', async () => {
    stored = storeMemory(sessionId, latestUserInput, final);
  });

  return {
    final,
    route,
    memoryUsed,
    memoryStored: stored,
  };
}
