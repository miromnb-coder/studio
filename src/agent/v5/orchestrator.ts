import { groq } from '@/ai/groq';
import { Intent, AgentStep, Decision, AgentMetadata } from './types';
import { TOOL_REGISTRY } from './registry';
import { fetchMemory, updateMemory } from './memory';

/**
 * @fileOverview Orchestrator Engine v5: Autonomous reasoning loop.
 */

const MAX_ITERATIONS = 6;

async function classifyIntent(input: string, history: any[]): Promise<{ intent: Intent; language: string }> {
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'Identify intent: finance, time_optimizer, monetization, technical, analysis, general. Detect language. JSON: {"intent": "...", "language": "..."}' },
      ...history.slice(-2),
      { role: 'user', content: input }
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  });
  return JSON.parse(res.choices[0]?.message?.content || '{"intent": "general", "language": "English"}');
}

export async function runAgentV5(input: string, userId: string, history: any[] = [], imageUri?: string) {
  console.log(`[ENGINE_V5] Initializing for user: ${userId}`);

  // 1. Context Retrieval
  const [memory, { intent, language }] = await Promise.all([
    fetchMemory(userId),
    classifyIntent(input, history)
  ]);

  // 2. Initial Planning
  const planRes = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: `Create a step-by-step strategy for intent: ${intent}. User language: ${language}.` },
      { role: 'user', content: input }
    ],
    temperature: 0.1
  });
  const initialPlan = planRes.choices[0]?.message?.content || "Analyze input and respond.";

  // 3. Autonomous Execution Loop (Think-Decide-Act-Observe)
  const steps: AgentStep[] = [];
  let currentIteration = 0;
  let loopFinished = false;
  let finalContext = "";

  while (!loopFinished && currentIteration < MAX_ITERATIONS) {
    currentIteration++;
    
    const decisionRes = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { 
          role: 'system', 
          content: `
            You are an autonomous agent. Current Intent: ${intent}.
            Language: ${language}. Memory: ${JSON.stringify(memory)}.
            
            TOOLS AVAILABLE:
            ${Object.values(TOOL_REGISTRY).map(t => `${t.name}: ${t.description}`).join('\n')}

            HISTORY OF ACTIONS:
            ${steps.map((s, i) => `Step ${i+1}: Action ${s.action} -> Result: ${JSON.stringify(s.observation)}`).join('\n')}

            DECIDE NEXT STEP. 
            If you have enough info, action: "final".
            If you need a tool, action: "tool_name", input: {}.
            Return JSON ONLY: {"thought": "reasoning...", "action": "...", "input": {}, "final": "only if action is final"}
          `
        },
        { role: 'user', content: input }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    });

    const decision: Decision = JSON.parse(decisionRes.choices[0]?.message?.content || '{"action": "final", "final": "I encountered an error in decision logic."}');
    
    if (decision.action === 'final' || !TOOL_REGISTRY[decision.action]) {
      finalContext = decision.final || decision.thought;
      loopFinished = true;
    } else {
      console.log(`[ENGINE_V5] Executing Action: ${decision.action}`);
      const tool = TOOL_REGISTRY[decision.action];
      try {
        const observation = await tool.execute(decision.input || {}, { userId, imageUri });
        steps.push({
          thought: decision.thought,
          action: decision.action,
          input: decision.input,
          observation
        });
      } catch (err) {
        steps.push({
          thought: decision.thought,
          action: decision.action,
          input: decision.input,
          observation: { error: "Action failed." }
        });
      }
    }
  }

  // 4. Response Generation (Final Synthesis)
  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { 
        role: 'system', 
        content: `
          Synthesize final response in ${language}.
          Context: ${finalContext}
          Tools Used: ${JSON.stringify(steps)}
          Memory: ${JSON.stringify(memory)}
          Do NOT repeat thoughts. Just the helpful answer.
        ` 
      },
      ...history.slice(-5),
      { role: 'user', content: input }
    ],
    temperature: 0.2,
    stream: true
  });

  const metadata: AgentMetadata = {
    intent,
    plan: initialPlan,
    steps,
    memoryUsed: !!memory,
    language,
    iterationCount: currentIteration
  };

  return { stream, metadata };
}
