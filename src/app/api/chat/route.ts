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

function systemInstructions(agent?: AgentName) {
  const base = 'You are Nova Operator, a concise, high-utility AI assistant for mobile users.';

  if (agent === 'Analysis Agent') {
    return `${base} Focus on quantitative reasoning, comparisons, and percentage changes. Use clear bullets.`;
  }

  if (agent === 'Memory Agent') {
    return `${base} Focus on summaries, preserving important context, and recommending next steps.`;
  }

  return `${base} Focus on research framing, trend analysis, and practical action plans.`;
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

  const provider = getAIProvider();
  const stageSteps = [
    'Researching relevant patterns…',
    'Analyzing important signals…',
    'Storing useful context…',
  ];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(streamLine({ type: 'meta', provider: provider.name }));

        for (const step of stageSteps) {
          controller.enqueue(streamLine({ type: 'step', status: 'running', label: step }));
          await new Promise((resolve) => setTimeout(resolve, 220));
          controller.enqueue(streamLine({ type: 'step', status: 'completed', label: step }));
        }

        await provider.streamChat(
          {
            messages: parsed.messages,
            systemPrompt: systemInstructions(parsed.agent),
          },
          (event) => {
            controller.enqueue(streamLine(event as unknown as Record<string, unknown>));
          },
        );

        controller.enqueue(streamLine({ type: 'done' }));
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected provider failure.';
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
