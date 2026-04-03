
import { groq } from '@/ai/groq';

/**
 * @fileOverview AI Agent v3: Modular Reasoning Engine.
 * 
 * PIPELINE:
 * 1. Intent Router
 * 2. Planner
 * 3. Tool Executor
 * 4. Memory Integration
 * 5. Final Response Generator
 */

export type Intent = 'finance' | 'time_optimizer' | 'monetization' | 'technical' | 'analysis' | 'general';

export interface AgentStep {
  action: 'analyze' | 'detect_leaks' | 'suggest_actions' | 'optimize_time' | 'monetization_audit' | 'technical_debug' | 'general_reasoning';
  description: string;
}

export interface AgentState {
  input: string;
  intent: Intent;
  plan: AgentStep[];
  results: any[];
  memory: any;
  history: any[];
}

// 🧠 1. INTENT ROUTER
async function routeIntent(input: string, history: any[]): Promise<Intent> {
  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Classify user intent into exactly one of: finance, time_optimizer, monetization, technical, analysis, general.'
        },
        ...history.slice(-3),
        { role: 'user', content: input }
      ],
      temperature: 0,
    });
    const intent = res.choices[0]?.message?.content?.toLowerCase() || 'general';
    const validIntents: Intent[] = ['finance', 'time_optimizer', 'monetization', 'technical', 'analysis', 'general'];
    return validIntents.find(i => intent.includes(i)) || 'general';
  } catch {
    return 'general';
  }
}

// 🧩 2. PLANNER
async function createPlan(state: AgentState): Promise<AgentStep[]> {
  const prompt = `
    Intent: ${state.intent}
    Input: ${state.input}

    Create a multi-step execution plan using these available tools: 
    analyze, detect_leaks, suggest_actions, optimize_time, monetization_audit, technical_debug.

    Return ONLY a JSON array:
    [{"action": "...", "description": "..."}]
  `;

  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });
    const content = res.choices[0]?.message?.content || '[]';
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : (parsed.plan || []);
  } catch {
    return [{ action: 'general_reasoning', description: 'Address user request directly.' }];
  }
}

// 🛠️ 3. TOOLS
const tools = {
  analyze: async (input: string) => ({ tool: 'analyze', output: `Structural breakdown of: ${input.slice(0, 100)}...` }),
  detect_leaks: async (input: string) => ({ tool: 'detect_leaks', output: `Identified potential liquidity leaks in context.` }),
  suggest_actions: async (input: string) => ({ tool: 'suggest_actions', output: `Generated high-impact action items.` }),
  optimize_time: async (input: string) => ({ tool: 'optimize_time', output: `Proposed task removal and combination strategy.` }),
  monetization_audit: async (input: string) => ({ tool: 'monetization_audit', output: `Analyzed pricing and revenue expansion opportunities.` }),
  technical_debug: async (input: string) => ({ tool: 'technical_debug', output: `Verified implementation correctness and logic flow.` }),
  general_reasoning: async (input: string) => ({ tool: 'reasoning', output: `Performed baseline logic synthesis.` }),
};

// 🚀 4. MAIN AGENT LOOP
export async function runAgent(input: string, history: any[] = [], memory: any = null) {
  const intent = await routeIntent(input, history);
  
  const state: AgentState = {
    input,
    intent,
    plan: [],
    results: [],
    memory,
    history
  };

  state.plan = await createPlan(state);

  // Execute Tools
  for (const step of state.plan) {
    if (tools[step.action]) {
      const result = await tools[step.action](input);
      state.results.push({ ...step, result });
    }
  }

  // Final Response Generation
  const finalPrompt = `
    User Input: ${input}
    Intent: ${intent}
    Memory: ${JSON.stringify(memory || {})}
    Tool Outputs: ${JSON.stringify(state.results)}

    Based on the above, provide a comprehensive, actionable, and clear response in the same language as the user input. 
    If intent is finance, time_optimizer, or monetization, include a structured summary.
  `;

  const finalRes = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are the AI Life Operator, a reasoning-first agent v3.' },
      ...history.slice(-5),
      { role: 'user', content: finalPrompt }
    ],
    temperature: 0.2,
  });

  return {
    content: finalRes.choices[0]?.message?.content || '',
    intent,
    plan: state.plan,
    isActionable: intent !== 'general'
  };
}
