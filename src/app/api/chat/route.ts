import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAIProvider } from '@/lib/ai/provider';
import type { AgentName } from '@/app/store/app-store';

const requestSchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant', 'system']), content: z.string().min(1) })).min(1),
  agent: z.custom<AgentName>().optional(),
});

const encoder = new TextEncoder();

function streamLine(payload: Record<string, unknown>) {
  return encoder.encode(`${JSON.stringify(payload)}\n`);
}

function buildSystemInstructions(agent?: AgentName) {
  const base = [
    'You are Nova Operator, a premium AI copilot.',
    'Primary goal: deliver actionable, high-confidence answers with clear structure.',
    'Always: (1) briefly restate objective, (2) show key findings, (3) provide concrete next actions.',
    'When information is uncertain, call out assumptions explicitly.',
    'Format cleanly with concise headers and bullets.',
    'Never expose secrets, API keys, or internal environment values.',
  ];

  if (agent === 'Analysis Agent') {
    return [
      ...base,
      'You are in Analysis mode: prioritize quantitative comparisons, percentages, tradeoffs, and risk levels.',
      'If user data is incomplete, ask one focused follow-up after providing a best-effort draft.',
    ].join(' ');
  }

  if (agent === 'Memory Agent') {
    return [
      ...base,
      'You are in Memory mode: synthesize context, preserve durable facts, and suggest what to store for future tasks.',
      'End with a short “Memory to retain” bullet list when relevant.',
    ].join(' ');
  }

  return [
    ...base,
    'You are in Research mode: identify signal vs noise, summarize current patterns, and translate findings into practical plans.',
    'Keep the final answer concise but specific.',
  ].join(' ');
}

function normalizeProviderError(providerName: string, error: unknown): string {
  const raw = error instanceof Error ? error.message : 'Unexpected provider failure.';

  if (providerName === 'groq' && /GROQ_API_KEY/i.test(raw)) {
    return 'Groq is selected but not configured. Set AI_PROVIDER=groq and add a valid GROQ_API_KEY (and optional GROQ_MODEL) on the server.';
  }

  if (providerName === 'openai' && /OPENAI_API_KEY/i.test(raw)) {
    return 'OpenAI is selected but not configured. Add OPENAI_API_KEY on the server or switch AI_PROVIDER=groq.';
  }

  return raw;
}

function pickAgent(messages: z.infer<typeof requestSchema>['messages'], providedAgent?: AgentName): AgentName {
  if (providedAgent) return providedAgent;
  const latestUser = [...messages].reverse().find((m) => m.role === 'user')?.content.toLowerCase() ?? '';

  if (/(summarize|recap|remember|memory|context)/.test(latestUser)) return 'Memory Agent';
  if (/(compare|analysis|analy|percent|ratio|difference|forecast)/.test(latestUser)) return 'Analysis Agent';
  return 'Research Agent';
}

export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof requestSchema>;

  try {
    const body = await request.json();
    parsed = requestSchema.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request payload.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let provider;
  try {
    provider = getAIProvider();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Provider configuration error.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const activeAgent = pickAgent(parsed.messages, parsed.agent);
  const stageSteps = ['Researching…', 'Analyzing…', 'Storing memory…', 'Final answer'];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(streamLine({ type: 'meta', provider: provider.name, agent: activeAgent }));

        for (const step of stageSteps.slice(0, -1)) {
          controller.enqueue(streamLine({ type: 'step', status: 'running', label: step }));
          await new Promise((resolve) => setTimeout(resolve, 200));
          controller.enqueue(streamLine({ type: 'step', status: 'completed', label: step }));
        }

        controller.enqueue(streamLine({ type: 'step', status: 'running', label: stageSteps[3] }));

        await provider.streamChat(
          {
            messages: parsed.messages,
            systemPrompt: buildSystemInstructions(activeAgent),
          },
          (event) => {
            controller.enqueue(streamLine(event as unknown as Record<string, unknown>));
          },
        );

        controller.enqueue(streamLine({ type: 'step', status: 'completed', label: stageSteps[3] }));
        controller.enqueue(streamLine({ type: 'done' }));
        controller.close();
      } catch (error) {
        const message = normalizeProviderError(provider.name, error);
        controller.enqueue(streamLine({ type: 'error', message }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
