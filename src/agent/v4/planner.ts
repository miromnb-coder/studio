import { groq } from '@/ai/groq';
import { Intent, AgentStep } from './types';

export async function createPlan(input: string, intent: Intent, history: any[]): Promise<AgentStep[]> {
  console.log("[PLANNER] Creating execution plan...");

  const prompt = `
User Intent: ${intent}
Input: ${input}

Return ONLY valid JSON in this format:
{
  "steps": [
    { "action": "analyze", "priority": "high" }
  ]
}

No explanation. No markdown.
`;

  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: prompt },
        ...history.slice(-2),
        { role: 'user', content: input }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    let content = res.choices[0]?.message?.content || "{}";

    // TURVALLINEN PARSE
    const parsed = JSON.parse(content);
    const plan: AgentStep[] = parsed.steps || [];

    if (!plan.length) {
      return [{ action: 'analyze', priority: 'high' }];
    }

    console.log("[PLANNER] Plan created:", plan.map(s => s.action).join(" -> "));
    return plan;

  } catch (err) {
    console.error("[PLANNER ERROR]", err);
    return [{ action: 'analyze', priority: 'high' }];
  }
}
