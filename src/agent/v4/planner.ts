import { groq } from '@/ai/groq';
import { AgentStep, Intent } from './types';

const ALLOWED_ACTIONS: AgentStep['action'][] = [
  'analyze',
  'detect_leaks',
  'optimize_time',
  'generate_strategy',
  'technical_debug',
  'suggest_actions',
  'calendar',
  'todo',
  'notes',
  'web-search',
  'file-analyzer',
];

function sanitizePlan(plan: AgentStep[]): AgentStep[] {
  return plan
    .filter((step) => ALLOWED_ACTIONS.includes(step.action))
    .map((step) => ({
      action: step.action,
      priority: step.priority || 'medium',
      description: step.description,
    }));
}

export async function createPlan(input: string, intent: Intent, history: any[]): Promise<AgentStep[]> {
  console.log('[PLANNER] Creating execution plan...');

  const prompt = `
You are the planning agent.

Task:
- Build a MULTI-STEP plan when helpful.
- Select explicit actions from this allowed list only:
  analyze, detect_leaks, optimize_time, generate_strategy, technical_debug, suggest_actions, calendar, todo, notes, web-search, file-analyzer
- Prefer specialized actions (calendar/todo/notes/web-search/file-analyzer) when user asks for those capabilities.

Return ONLY valid JSON in this exact format:
{
  "steps": [
    { "action": "analyze", "priority": "high", "description": "why this step" }
  ]
}

Rules:
- No markdown.
- No extra fields.
- Steps should be deterministic and ordered.
- At least 1 step, at most 4.

User Intent: ${intent}
Input: ${input}
`;

  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: prompt }, ...history.slice(-2), { role: 'user', content: input }],
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    const content = res.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content) as { steps?: AgentStep[] };
    const plan = sanitizePlan(parsed.steps || []);

    if (!plan.length) {
      return [{ action: 'analyze', priority: 'high', description: 'Fallback analysis step.' }];
    }

    console.log('[PLANNER] Plan created:', plan.map((s) => s.action).join(' -> '));
    return plan;
  } catch (err) {
    console.error('[PLANNER ERROR]', err);
    return [{ action: 'analyze', priority: 'high', description: 'Fallback analysis step.' }];
  }
}
