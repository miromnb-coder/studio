
import { groq } from '@/ai/groq';
import { Intent, AgentStep, Decision, AgentMetadata, ToolDefinition } from './types';
import { activeRegistry } from './registry';
import { fetchMemory, addEpisodicEvent, fetchRecentEpisodicEvents, summarizeEpisodicMemory, AgentMemory } from './memory';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * @fileOverview Orchestrator Engine v6.1: Hierarchical Memory, Deep Context Fetching, and Verbose Logging.
 */

const MAX_ITERATIONS = 4;

async function classifyIntent(input: string, history: any[]): Promise<{ intent: Intent; language: string }> {
  console.log("[ORCHESTRATOR] Classifying intent...");
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
  const result = JSON.parse(res.choices[0]?.message?.content || '{"intent": "general", "language": "English"}');
  console.log(`[ORCHESTRATOR] Intent: ${result.intent}, Language: ${result.language}`);
  return result;
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
      console.log(`[DYNAMIC_TOOL:${config.id}] Executing...`);
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
  console.log(`[AGENT_V6_START] User: ${userId}`);
  
  const { firestore } = initializeFirebase();
  
  // 1. FETCH RECENT ANALYTICS CONTEXT (As requested for debugging)
  let analyses: any[] = [];
  let alerts: any[] = [];
  try {
    if (firestore && userId !== 'system_anonymous') {
      console.log("[ORCHESTRATOR] Fetching live Firestore context...");
      const [analysesSnap, alertsSnap] = await Promise.all([
        getDocs(query(collection(firestore, 'users', userId, 'analyses'), orderBy('createdAt', 'desc'), limit(5))),
        getDocs(query(collection(firestore, 'users', userId, 'alerts'), where('isDismissed', '==', false), limit(5)))
      ]);
      analyses = analysesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      alerts = alertsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log(`[CONTEXT] Fetched ${analyses.length} analyses and ${alerts.length} active alerts.`);
    }
  } catch (err: any) {
    console.error("[CONTEXT_FETCH_FAILED]", err.message);
  }

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
  let toolData: any = null;

  while (!loopFinished && currentIteration < MAX_ITERATIONS) {
    currentIteration++;
    const availableTools = activeRegistry.getAvailableTools();
    console.log(`[LOOP] Iteration ${currentIteration}. Deciding next action...`);
    
    const decisionRes = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { 
          role: 'system', 
          content: `
            You are an autonomous agent. Current Intent: ${intent}. Language: ${language}.
            TOOLS: ${availableTools.map(t => `${t.id}: ${t.description}`).join("\n")}
            CONTEXT_ANALYSES: ${JSON.stringify(analyses)}
            CONTEXT_ALERTS: ${JSON.stringify(alerts)}
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
    console.log(`[DECISION] Action: ${decision.action}. Thought: ${decision.thought}`);
    
    if (decision.action === 'forge_tool') {
      const newTool = await forgeNewTool(decision.input.purpose, userId);
      activeRegistry.register(newTool);
      steps.push({ thought: decision.thought, action: 'forge_tool', input: decision.input, observation: { forged: newTool.name } });
      continue;
    }

    if (decision.action === 'final' || !activeRegistry.getTool(decision.action)) {
      loopFinished = true;
    } else {
      const tool = activeRegistry.getTool(decision.action)!;
      try {
        console.log(`[EXECUTE] Running tool: ${tool.id}...`);
        const observation = await tool.execute(decision.input || {}, { userId, imageUri });
        console.log(`[OBSERVATION] Tool ${tool.id} returned data.`);
        
        steps.push({ thought: decision.thought, action: decision.action, input: decision.input, observation });
        await addEpisodicEvent(userId, { input: decision.input, action: decision.action, observation });
        
        if (observation.leaks || observation.insights || observation.findings) {
          toolData = {
            ...toolData,
            ...observation,
            estimatedMonthlySavings: observation.estimatedMonthlySavings || observation.impact || toolData?.estimatedMonthlySavings || 0
          };
        }
      } catch (err: any) {
        console.error(`[EXECUTION_ERROR] Tool ${tool.id} failed:`, err.message);
        const errorObservation = { error: `Execution failed: ${err.message}` };
        steps.push({ thought: decision.thought, action: decision.action, input: decision.input, observation: errorObservation });
        await addEpisodicEvent(userId, { input: decision.input, action: decision.action, observation: errorObservation });
      }
    }
  }

  console.log("[ORCHESTRATOR] Synthesizing final response...");
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
          IF ERRORS OCCURRED IN TOOLS, EXPLAIN THEM TO THE USER HONESTLY.
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
