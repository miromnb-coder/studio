import { ai } from '@/ai/genkit';
import { Intent, AgentStep, Decision, AgentMetadata, ToolDefinition } from './types';
import { activeRegistry, STATIC_TOOLS } from './registry';
import { fetchMemory, updateMemory } from './memory';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * @fileOverview Orchestrator Engine v5.6: Autonomous Reasoning with Deep Synthesis.
 * Powered by Genkit 1.x and Groq.
 */

const MAX_ITERATIONS = 4;

async function classifyIntent(input: string, history: any[]): Promise<{ intent: Intent; language: string }> {
  const { output } = await ai.generate({
    model: 'groq/llama-3.3-70b-versatile',
    system: 'Identify intent: finance, time_optimizer, monetization, technical, analysis, general. Detect language. JSON: {"intent": "...", "language": "..."}',
    prompt: `History: ${JSON.stringify(history.slice(-2))}\nInput: ${input}`,
    config: {
      responseFormat: 'json',
      temperature: 0,
    }
  });
  
  try {
    return JSON.parse(output?.text || '{"intent": "general", "language": "English"}');
  } catch {
    return { intent: 'general', language: 'English' };
  }
}

async function forgeNewTool(purpose: string, userId: string): Promise<ToolDefinition> {
  console.log(`[THE_FORGE] Forging new tool for purpose: ${purpose}`);
  
  const { output } = await ai.generate({
    model: 'groq/llama-3.3-70b-versatile',
    system: `
      Forge a new AI Tool definition. 
      Return JSON ONLY:
      {
        "id": "slug_style_id",
        "name": "Human Friendly Name",
        "description": "Short purpose",
        "systemPrompt": "Instructions for sub-agent",
        "inputSchema": { "type": "object", "properties": { "context": { "type": "string" } } }
      }
    `,
    prompt: `Purpose: ${purpose}`,
    config: {
      responseFormat: 'json',
      temperature: 0.2
    }
  });

  const config = JSON.parse(output?.text || '{}');
  
  const forgedTool: ToolDefinition = {
    id: config.id || `tool_${Date.now()}`,
    name: config.name || 'Unnamed Protocol',
    description: config.description || 'Custom function.',
    inputSchema: config.inputSchema,
    isDynamic: true,
    execute: async (input: any) => {
      const { output: runOutput } = await ai.generate({
        model: 'groq/llama-3.3-70b-versatile',
        system: config.systemPrompt + ". ALWAYS output a summary and findings array.",
        prompt: JSON.stringify(input),
        config: { temperature: 0 }
      });
      return { result: runOutput?.text || '', findings: [], forged: true };
    }
  };

  const { firestore } = initializeFirebase();
  if (firestore && userId !== 'system_anonymous') {
    try {
      await addDoc(collection(firestore, 'users', userId, 'forged_tools'), {
        ...config,
        userId,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("[ORCHESTRATOR] Failed to persist tool.");
    }
  }

  return forgedTool;
}

export async function runAgentV5(input: string, userId: string, history: any[] = [], imageUri?: string) {
  const [memory, { intent, language }] = await Promise.all([
    fetchMemory(userId),
    classifyIntent(input, history)
  ]);

  const steps: AgentStep[] = [];
  let currentIteration = 0;
  let loopFinished = false;
  let toolData: any = null;

  while (!loopFinished && currentIteration < MAX_ITERATIONS) {
    currentIteration++;
    const availableTools = activeRegistry.getAvailableTools();
    
    const { output } = await ai.generate({
      model: 'groq/llama-3.3-70b-versatile',
      system: `
        You are an autonomous agent. Current Intent: ${intent}. Language: ${language}.
        TOOLS: ${availableTools.map(t => `${t.id}: ${t.description}`).join('\n')}
        META: If no tool fits, action: "forge_tool", input: {"purpose": "description"}.
        DECIDE. JSON ONLY: {"thought": "...", "action": "tool_id|forge_tool|final", "input": {}, "final": "..."}
      `,
      prompt: input,
      config: {
        responseFormat: 'json',
        temperature: 0.1
      }
    });

    const decision: Decision = JSON.parse(output?.text || '{"action": "final"}');
    
    if (decision.action === 'forge_tool') {
      const newTool = await forgeNewTool(decision.input.purpose, userId);
      activeRegistry.register(newTool);
      steps.push({ thought: decision.thought, action: 'forge_tool', input: decision.input, observation: { forged: newTool.name } });
      continue;
    }

    if (decision.action === 'final' || !activeRegistry.getTool(decision.action as string)) {
      loopFinished = true;
    } else {
      const tool = activeRegistry.getTool(decision.action as string)!;
      try {
        const observation = await tool.execute(decision.input || {}, { userId, imageUri });
        steps.push({ thought: decision.thought, action: decision.action as string, input: decision.input, observation });
        
        if (observation.leaks || observation.insights || observation.findings) {
          toolData = {
            ...toolData,
            ...observation,
            estimatedMonthlySavings: observation.estimatedMonthlySavings || observation.impact || toolData?.estimatedMonthlySavings || 0
          };
        }
      } catch (err) {
        steps.push({ thought: decision.thought, action: decision.action as string, input: decision.input, observation: { error: "Failed" } });
      }
    }
  }

  const { stream } = ai.generateStream({
    model: 'groq/llama-3.3-70b-versatile',
    system: `
      Synthesis in ${language}.
      Tool Results: ${JSON.stringify(steps)}
      Memory: ${JSON.stringify(memory)}
      Respond directly. If a tool found savings or data, confirm it clearly.
    `,
    prompt: `History: ${JSON.stringify(history.slice(-3))}\nUser Input: ${input}`,
    config: { temperature: 0.2 }
  });

  const metadata: AgentMetadata = {
    intent,
    plan: "Reasoning Cycle Completed.",
    steps,
    memoryUsed: !!memory,
    language,
    iterationCount: currentIteration,
    structuredData: toolData
  };

  return { stream, metadata };
}
