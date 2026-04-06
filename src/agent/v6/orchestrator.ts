
import { groq } from '@/ai/groq';
import { Intent, AgentStep, Decision, AgentMetadata, ToolDefinition } from './types';
import { activeRegistry, STATIC_TOOLS } from './registry';
import { fetchMemory, updateMemory, addEpisodicEvent, fetchRecentEpisodicEvents, summarizeEpisodicMemory, AgentMemory, EpisodicEvent } from './memory';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * @fileOverview Orchestrator Engine v6.0: Hierarchical Memory, Advanced Tool Use, and Metareasoning.
 * Optimized for real-world tool execution and proactive signal detection.
 */

const MAX_ITERATIONS = 4;

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

async function forgeNewTool(purpose: string, userId: string): Promise<ToolDefinition> {
  console.log(`[THE_FORGE] Forging new tool for purpose: ${purpose}`);
  
  const forgeRes = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { 
        role: 'system', 
        content: `
          Forge a new AI Tool definition. 
          Return JSON ONLY:
          {
            "id": "slug_style_id",
            "name": "Human Friendly Name",
            "description": "Short purpose",
            "systemPrompt": "Instructions for sub-agent",
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
    description: config.description || 'Custom function.',
    inputSchema: config.inputSchema,
    isDynamic: true,
    execute: async (input: any) => {
      const runRes = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: config.systemPrompt + ". ALWAYS output a summary and findings array." },
          { role: 'user', content: JSON.stringify(input) }
        ],
        temperature: 0
      });
      return { result: runRes.choices[0]?.message?.content || '', findings: [], forged: true };
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

export async function runAgentV6(input: string, userId: string, history: any[] = [], imageUri?: string) {
  const [mainMemory, { intent, language }] = await Promise.all([
    fetchMemory(userId),
    classifyIntent(input, history)
  ]);
  let memory: AgentMemory = mainMemory || { userId, goals: [], preferences: [], behaviorSummary: 'Initial state.', semanticMemory: [], lastUpdated: serverTimestamp() };
  const recentEpisodicEvents = await fetchRecentEpisodicEvents(userId);
  const episodicSummary = await summarizeEpisodicMemory(userId, recentEpisodicEvents);

  const steps: AgentStep[] = [];
  let currentIteration = 0;
  let loopFinished = false;
  let finalContext = "";
  let toolData: any = null;

  while (!loopFinished && currentIteration < MAX_ITERATIONS) {
    currentIteration++;
    const availableTools = activeRegistry.getAvailableTools();
    
    const decisionRes = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { 
          role: 'system', 
          content: `
            You are an autonomous agent. Current Intent: ${intent}. Language: ${language}.
            TOOLS: ${availableTools.map(t => `${t.id}: ${t.description}`).join("\n")}
            MEMORY: ${JSON.stringify(memory)}
            RECENT_ACTIVITY: ${episodicSummary}
            META: If no tool fits, action: "forge_tool", input: {"purpose": "description"}.
            DECIDE. JSON ONLY: {"thought": "...", "action": "tool_id|forge_tool|final", "input": {}, "final": "..."}
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
      steps.push({ thought: decision.thought, action: 'forge_tool', input: decision.input, observation: { forged: newTool.name } });
      continue;
    }

    if (decision.action === 'final' || !activeRegistry.getTool(decision.action)) {
      finalContext = decision.final || decision.thought;
      loopFinished = true;
    } else {
      const tool = activeRegistry.getTool(decision.action)!;
      try {
        let observation;
        try {
          observation = await tool.execute(decision.input || {}, { userId, imageUri });
          steps.push({ thought: decision.thought, action: decision.action, input: decision.input, observation });
          await addEpisodicEvent(userId, { input: decision.input, action: decision.action, observation });
          
          // ENHANCED: Capture structured data for UI and Proactive Alerts
          if (observation.leaks || observation.insights || observation.findings) {
            toolData = {
              ...toolData,
              ...observation,
              estimatedMonthlySavings: observation.estimatedMonthlySavings || observation.impact || toolData?.estimatedMonthlySavings || 0
            };
          }
        } catch (err: any) {
          observation = { error: `Tool execution failed: ${err.message}` };
          steps.push({ thought: decision.thought, action: decision.action, input: decision.input, observation });
          await addEpisodicEvent(userId, { input: decision.input, action: decision.action, observation });
          // Agent should reflect on this error and potentially re-decide
          // For now, we just log and continue, but this is a point for future enhancement
          console.error(`[ORCHESTRATOR_V6] Tool ${tool.id} failed:`, err);
        }
      } catch (err) {
        steps.push({ thought: decision.thought, action: decision.action, input: decision.input, observation: { error: "Failed" } });
      }
    }
  }

  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { 
        role: 'system', 
        content: `
          Synthesis in ${language}.
          Tool Results: ${JSON.stringify(steps)}
          Main Memory: ${JSON.stringify(memory)}
          Recent Episodic Events: ${episodicSummary}
          Respond directly. If a tool found savings or data, confirm it clearly.
        ` 
      },
      ...history.slice(-3),
      { role: 'user', content: input }
    ],
    temperature: 0.2,
    stream: true
  });

  const metadata: AgentMetadata = {
    intent,
    plan: "Reasoning Cycle Completed.",
    steps,
    memoryUsed: !!mainMemory,
    language,
    iterationCount: currentIteration,
    structuredData: toolData
  };

  return { stream, metadata };
}
