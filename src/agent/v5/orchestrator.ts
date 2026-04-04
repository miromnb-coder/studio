import { groq } from '@/ai/groq';
import { Intent, AgentStep, Decision, AgentMetadata, ToolDefinition } from './types';
import { activeRegistry, STATIC_TOOLS } from './registry';
import { fetchMemory, updateMemory } from './memory';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * @fileOverview Orchestrator Engine v5.5: Autonomous Reasoning with Dynamic Tool Forging.
 * Allows the agent to create its own tools if a capability is missing.
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

/**
 * The Forge: Uses LLM to create a new tool definition.
 */
async function forgeNewTool(purpose: string, userId: string): Promise<ToolDefinition> {
  console.log(`[THE_FORGE] Forging new tool for purpose: ${purpose}`);
  
  const forgeRes = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { 
        role: 'system', 
        content: `
          Forge a new AI Tool definition. 
          The tool will be executed by an LLM sub-agent.
          
          Return JSON ONLY:
          {
            "id": "slug_style_id",
            "name": "Human Friendly Name",
            "description": "Short purpose of the tool",
            "systemPrompt": "Instructions for the sub-agent that will run this tool",
            "inputSchema": { "type": "object", "properties": { "context": { "type": "string" } } }
          }
        `
      },
      { role: 'user', content: `Purpose: ${purpose}` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2
  });

  const config = JSON.parse(forgeRes.choices[0]?.message?.content || '{}');
  
  const forgedTool: ToolDefinition = {
    id: config.id || `tool_${Date.now()}`,
    name: config.name || 'Unnamed Protocol',
    description: config.description || 'Custom autonomous function.',
    inputSchema: config.inputSchema,
    isDynamic: true,
    execute: async (input: any) => {
      const runRes = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: JSON.stringify(input) }
        ],
        temperature: 0
      });
      return { result: runRes.choices[0]?.message?.content || '' };
    }
  };

  // Persist the forged tool to Firestore for the user's Marketplace
  const { firestore } = initializeFirebase();
  if (firestore && userId !== 'system_anonymous') {
    try {
      await addDoc(collection(firestore, 'users', userId, 'forged_tools'), {
        ...config,
        userId,
        createdAt: serverTimestamp(),
        usageCount: 0,
        moneySaved: 0,
        timeSaved: 0
      });
    } catch (e) {
      console.warn("[ORCHESTRATOR] Failed to persist forged tool metadata.");
    }
  }

  return forgedTool;
}

export async function runAgentV5(input: string, userId: string, history: any[] = [], imageUri?: string) {
  console.log(`[ENGINE_V5.5] Initializing for user: ${userId}`);

  const [memory, { intent, language }] = await Promise.all([
    fetchMemory(userId),
    classifyIntent(input, history)
  ]);

  const planRes = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: `Create a strategy for intent: ${intent}. Language: ${language}.` },
      { role: 'user', content: input }
    ],
    temperature: 0.1
  });
  const initialPlan = planRes.choices[0]?.message?.content || "Analyze and respond.";

  const steps: AgentStep[] = [];
  let currentIteration = 0;
  let loopFinished = false;
  let finalContext = "";
  let toolUsedName = "";
  let toolSummary = "";
  let forgedToolInfo: any = null;

  while (!loopFinished && currentIteration < MAX_ITERATIONS) {
    currentIteration++;
    
    const availableTools = activeRegistry.getAvailableTools();
    
    const decisionRes = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { 
          role: 'system', 
          content: `
            You are an autonomous agent. Current Intent: ${intent}.
            Language: ${language}. Memory: ${JSON.stringify(memory)}.
            
            TOOLS AVAILABLE:
            ${availableTools.map(t => `${t.id}: ${t.description}`).join('\n')}

            META-ABILITY: 
            If NO tool matches the task perfectly, action: "forge_tool", input: {"purpose": "describe capability needed"}.

            DECIDE NEXT STEP. 
            JSON ONLY: {"thought": "...", "action": "tool_id|forge_tool|final", "input": {}, "final": "..."}
          `
        },
        { role: 'user', content: input }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    });

    const decision: Decision = JSON.parse(decisionRes.choices[0]?.message?.content || '{"action": "final"}');
    
    if (decision.action === 'forge_tool') {
      const newTool = await forgeNewTool(decision.input.purpose, userId);
      activeRegistry.register(newTool);
      forgedToolInfo = { name: newTool.name, description: newTool.description };
      steps.push({ thought: decision.thought, action: 'forge_tool', input: decision.input, observation: { forged: newTool.name } });
      // Continue loop - the new tool is now available for the next iteration!
      continue;
    }

    if (decision.action === 'final' || !activeRegistry.getTool(decision.action)) {
      finalContext = decision.final || decision.thought;
      loopFinished = true;
    } else {
      const tool = activeRegistry.getTool(decision.action)!;
      toolUsedName = tool.name;
      try {
        const observation = await tool.execute(decision.input || {}, { userId, imageUri });
        steps.push({ thought: decision.thought, action: decision.action, input: decision.input, observation });
        toolSummary = `Processed via ${tool.name}.`;
      } catch (err) {
        steps.push({ thought: decision.thought, action: decision.action, input: decision.input, observation: { error: "Action failed." } });
      }
    }
  }

  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { 
        role: 'system', 
        content: `
          Final Synthesis in ${language}.
          Context: ${finalContext}
          Tools Used: ${JSON.stringify(steps)}
          Forged Tools: ${JSON.stringify(forgedToolInfo)}
          Respond directly and helpfully.
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
    iterationCount: currentIteration,
    toolUsed: toolUsedName,
    toolResultSummary: toolSummary,
    forgedTool: forgedToolInfo
  };

  return { stream, metadata };
}
