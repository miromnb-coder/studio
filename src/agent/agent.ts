import { groq } from '@/ai/groq';
import { executeTools, tools } from './tools';

/**
 * @fileOverview AI Agent v3: Modular Reasoning Engine.
 * 
 * PIPELINE:
 * 1. Intent Router (Language-aware)
 * 2. Dynamic Planner (JSON structured)
 * 3. Tool Executor (Synchronous/Asynchronous)
 * 4. Memory Integration (Firestore-backed)
 * 5. Final Response Generator (Context-aware)
 */

export type Intent = 'finance' | 'time_optimizer' | 'monetization' | 'technical' | 'analysis' | 'general';

export interface AgentStep {
  action: keyof typeof tools;
  description: string;
}

export interface AgentResult {
  content: string;
  intent: Intent;
  plan: AgentStep[];
  toolOutputs: any[];
  isActionable: boolean;
  mode: string;
  data?: any;
}

// 🧠 1. INTENT ROUTER
async function routeIntent(input: string, history: any[]): Promise<{ intent: Intent; language: string }> {
  const prompt = `
    Analyze the following user input and conversation history.
    1. Detect the user's language (e.g., Finnish, English, etc.).
    2. Classify intent into exactly one of: finance, time_optimizer, monetization, technical, analysis, general.
    
    Return ONLY JSON: {"intent": "...", "language": "..."}
  `;

  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: prompt },
        ...history.slice(-3),
        { role: 'user', content: input }
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });
    
    const content = JSON.parse(res.choices[0]?.message?.content || '{}');
    return {
      intent: content.intent || 'general',
      language: content.language || 'English'
    };
  } catch (err) {
    console.error("Router Error:", err);
    return { intent: 'general', language: 'English' };
  }
}

// 🧩 2. PLANNER
async function createPlan(input: string, intent: Intent, history: any[]): Promise<AgentStep[]> {
  const prompt = `
    User Intent: ${intent}
    User Input: ${input}

    Available Tools: analyze, detect_leaks, suggest_actions, optimize_time, monetization_audit, technical_debug.
    
    Create a step-by-step plan to address the user request.
    Return ONLY a JSON array of steps: [{"action": "tool_name", "description": "why use this"}]
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
    
    const content = res.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    const plan = Array.isArray(parsed) ? parsed : (parsed.plan || parsed.steps || []);
    
    // Filter to valid tools
    return plan.filter((step: any) => tools[step.action as keyof typeof tools]);
  } catch (err) {
    console.error("Planner Error:", err);
    return [{ action: 'analyze', description: 'Baseline analysis' }];
  }
}

// 🚀 MAIN AGENT LOOP
export async function runAgent(input: string, history: any[] = [], memory: any = null, imageUri?: string): Promise<AgentResult> {
  // 1. Route Intent & Detect Language
  const { intent, language } = await routeIntent(input, history);
  console.log("INTENT:", intent, "LANGUAGE:", language);

  // 2. Planning
  const plan = await createPlan(input, intent, history);
  console.log("PLAN:", JSON.stringify(plan));

  // 3. Tool Execution
  const toolResults = await executeTools(plan, input, imageUri);
  console.log("TOOLS:", JSON.stringify(toolResults));

  // 4. Response Generation
  const finalPrompt = `
    User Input: ${input}
    Detected Language: ${language}
    Intent: ${intent}
    Memory: ${JSON.stringify(memory || {})}
    Tool Outputs: ${JSON.stringify(toolResults)}

    OBJECTIVE:
    Provide a comprehensive, actionable, and extremely clear response in ${language}.
    If intent is finance, provide specific savings. 
    If intent is time, provide specific removals.
    
    Return a structured JSON object:
    {
      "summary": "Main response body",
      "strategy": "The implementation plan/advice",
      "title": "Short header",
      "mode": "${intent}",
      "isActionable": true,
      "data": { "savingsEstimate": 0, "detectedItems": [] }
    }
  `;

  const finalRes = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are the AI Life Operator, a reasoning-first agent v3.' },
      ...history.slice(-5),
      { role: 'user', content: finalPrompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const parsedResponse = JSON.parse(finalRes.choices[0]?.message?.content || '{}');

  return {
    content: parsedResponse.summary || '',
    intent,
    plan,
    toolOutputs: toolResults,
    isActionable: !!parsedResponse.isActionable,
    mode: parsedResponse.mode || intent,
    data: {
      ...parsedResponse,
      ...parsedResponse.data
    }
  };
}
