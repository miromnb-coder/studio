import { groq } from '@/ai/groq';
import { Intent, AgentStep, TOOL_ACTION_IDS, ToolActionId } from './types';

const TOOL_IDS_LIST = TOOL_ACTION_IDS.map(id => `- ${id}`).join('\n');
const FALLBACK_ACTION: ToolActionId = 'file.analyze';

export async function createPlan(input: string, intent: Intent, history: any[]): Promise<AgentStep[]> {
  console.log('[PLANNER] Creating execution plan...');

  const prompt = `
You are a deterministic planner.

Available tool action IDs (use only these exact strings):
${TOOL_IDS_LIST}

Intent to action mapping defaults:
- finance -> notes.summarize, todo.plan
- time_optimizer -> calendar.analyze, todo.plan
- monetization -> web.search, notes.summarize, todo.plan
- technical -> file.analyze, notes.summarize
- analysis -> file.analyze, notes.summarize
- general -> notes.summarize

Rules:
1) Return ONLY valid JSON with this shape:
{
  "steps": [
    { "action": "file.analyze", "priority": "high" }
  ]
}
2) Use 1-3 steps.
3) Actions must come from the available IDs.
4) Priority must be one of: high, medium, low.
5) No markdown, comments, or extra keys.

User Intent: ${intent}
Input: ${input}
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
      temperature: 0
    });

    const content = res.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    const rawPlan = Array.isArray(parsed.steps) ? parsed.steps : [];

    const allowed = new Set<string>(TOOL_ACTION_IDS);
    const plan: AgentStep[] = rawPlan
      .filter((step: any) => typeof step?.action === 'string' && allowed.has(step.action))
      .map((step: any) => ({
        action: step.action as ToolActionId,
        priority:
          step.priority === 'high' || step.priority === 'medium' || step.priority === 'low'
            ? step.priority
            : 'medium'
      }));

    if (!plan.length) {
      return [{ action: FALLBACK_ACTION, priority: 'high' }];
    }

    console.log('[PLANNER] Plan created:', plan.map(s => s.action).join(' -> '));
    return plan.slice(0, 3);
  } catch (err) {
    console.error('[PLANNER ERROR]', err);
    return [{ action: FALLBACK_ACTION, priority: 'high' }];
  }
}
