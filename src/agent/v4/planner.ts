import { groq } from '@/ai/groq';
import { Intent, AgentStep } from './types';

/**
 * @fileOverview Planner Agent: Creates a multi-step execution plan.
 */

export async function createPlan(input: string, intent: Intent, history: any[]): Promise<AgentStep[]> {
  console.log("[PLANNER] Creating execution plan...");
  const prompt = `
    User Intent: ${intent}
    Input: ${input}

    Available Tools: analyze, detect_leaks, suggest_actions, optimize_time, generate_strategy, technical_debug.
    
    Return ONLY a JSON array of steps: [{"action": "tool_name", "priority": "high|medium|low"}]
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
    
    const content = res.choices[0]?.message?.content || '[]';
    const parsed = JSON.parse(content);
    const plan = Array.isArray(parsed) ? parsed : (parsed.plan || parsed.steps || []);
    
    if (plan.length === 0) return [{ action: 'analyze', priority: 'high' }];
    console.log("[PLANNER] Plan created:", plan.map(s => s.action).join(" -> "));
    return plan;
  } catch (err) {
    return [{ action: 'analyze', priority: 'high' }];
  }
}
