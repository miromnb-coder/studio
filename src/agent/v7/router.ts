import { groq } from '@/ai/groq';
import { AgentIntent, AgentMessage, RouteResult } from './types';

const INTENTS: AgentIntent[] = ['finance', 'analysis', 'technical', 'general'];

function keywordRoute(input: string): RouteResult | null {
  const lower = input.toLowerCase();

  if (/budget|expense|spend|subscription|savings|invoice|cost|bill/.test(lower)) {
    return { intent: 'finance', confidence: 0.82, reason: 'Keyword match for finance domain.' };
  }

  if (/debug|code|api|error|stack|typescript|next\.js|database|query/.test(lower)) {
    return { intent: 'technical', confidence: 0.82, reason: 'Keyword match for technical domain.' };
  }

  if (/analy(z|s)e|compare|evaluate|audit|review|risk/.test(lower)) {
    return { intent: 'analysis', confidence: 0.78, reason: 'Keyword match for analysis domain.' };
  }

  return null;
}

function safeParseRoute(content: string | null | undefined): RouteResult {
  if (!content) {
    return { intent: 'general', confidence: 0.4, reason: 'Empty model output. Fallback to general.' };
  }

  try {
    const parsed = JSON.parse(content) as Partial<RouteResult>;
    const intent = INTENTS.includes(parsed.intent as AgentIntent) ? (parsed.intent as AgentIntent) : 'general';

    return {
      intent,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.65,
      reason: typeof parsed.reason === 'string' ? parsed.reason : 'Model classification route.',
    };
  } catch {
    return { intent: 'general', confidence: 0.45, reason: 'Invalid JSON route response. Fallback to general.' };
  }
}

export async function routeIntent(input: string, history: AgentMessage[] = []): Promise<RouteResult> {
  const keyword = keywordRoute(input);
  if (keyword) return keyword;

  const safeHistory = history
    .filter((m) => typeof m?.content === 'string' && m.content.trim().length > 0)
    .slice(-2)
    .map((m) => ({ role: m.role, content: m.content.trim() }));

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Classify intent into one of: finance, analysis, technical, general. Return JSON: {"intent":"...","confidence":0-1,"reason":"..."}.',
      },
      ...safeHistory,
      { role: 'user', content: input || 'General request.' },
    ],
  });

  return safeParseRoute(response.choices[0]?.message?.content);
}
