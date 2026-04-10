import { groq } from '@/ai/groq';
import { Intent, AgentStep, Decision, AgentMetadata, ToolDefinition } from './types';
import { activeRegistry } from './registry';
import { fetchMemory, addEpisodicEvent, fetchRecentEpisodicEvents, summarizeEpisodicMemory, AgentMemory } from './memory';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * @fileOverview Orchestrator Engine v6.1: Exclusively Groq-powered reasoning loop.
 */

const MAX_ITERATIONS = 4;

async function classifyIntent(input: string, history: any[]): Promise<{ intent: Intent; language: string }> {
  const safeHistory = (history || [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role || 'user',
      content: m.content.trim(),
    }));

  console.log('CALLING GROQ (classifyIntent)...');
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'Identify intent: finance, time_optimizer, monetization, technical, analysis, general. Detect language. JSON: {"intent": "...", "language": "..."}',
      },
      ...safeHistory.slice(-2),
      { role: 'user', content: input || 'Initialize intent check.' },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  });
  console.log('GROQ RESPONSE RECEIVED');
  return JSON.parse(res.choices[0]?.message?.content || '{"intent": "general", "language": "English"}');
}

async function forgeNewTool(purpose: string, userId: string): Promise<ToolDefinition> {
  console.log('CALLING GROQ (forgeNewTool)...');
  const forgeRes = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'Forge a new AI Tool definition. JSON: {"id": "slug", "name": "Name", "description": "Desc", "systemPrompt": "Instructions", "inputSchema": {}}',
      },
      { role: 'user', content: `Purpose: ${purpose}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });
  console.log('GROQ RESPONSE RECEIVED');

  const config = JSON.parse(forgeRes.choices[0]?.message?.content || '{}');

  const forgedTool: ToolDefinition = {
    id: config.id || `tool_${Date.now()}`,
    name: config.name || 'Unnamed Protocol',
    description: config.description || 'Custom function.',
    inputSchema: config.inputSchema,
    isDynamic: true,
    execute: async (input: any) => {
      console.log('CALLING GROQ (DynamicTool Execution)...');
      const runRes = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: config.systemPrompt + '. ALWAYS output summary.' },
          { role: 'user', content: JSON.stringify(input) },
        ],
        temperature: 0,
      });
      console.log('GROQ RESPONSE RECEIVED');
      return { result: runRes.choices[0]?.message?.content || '', findings: [], forged: true };
    },
  };

  if (userId !== 'system_anonymous') {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.from('finance_history').insert({
        user_id: userId,
        event_type: 'agent_v6_forged_tool',
        title: `Forged tool: ${forgedTool.name}`,
        summary: String(forgedTool.description || '').slice(0, 500),
        metadata: config,
      });
    } catch (error) {
      console.warn('[AGENT_V6] Failed to persist forged tool event', error);
    }
  }

  return forgedTool;
}

export async function runAgentV6(input: string, userId: string, history: any[] = [], imageUri?: string) {
  console.log('AGENT STARTED (Engine V6.1 / Groq Exclusive)', input);

  let analyses: any[] = [];
  let alerts: any[] = [];
  try {
    if (userId !== 'system_anonymous') {
      const supabase = await createSupabaseServerClient();
      const { data: historyRows } = await supabase
        .from('finance_history')
        .select('id,event_type,title,summary,metadata,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      const rows = historyRows || [];
      analyses = rows.filter((row: any) => String(row.event_type || '').includes('analysis')).slice(0, 5);
      alerts = rows.filter((row: any) => String(row.event_type || '').includes('alert')).slice(0, 5);
    }
  } catch {
    // Compatibility mode: keep agent execution resilient.
  }

  const [mainMemory, { intent, language }] = await Promise.all([fetchMemory(userId), classifyIntent(input, history)]);

  let memory: AgentMemory =
    mainMemory ||
    ({
      userId,
      goals: [],
      preferences: [],
      behaviorSummary: 'Initial state.',
      semanticMemory: [],
      lastUpdated: new Date().toISOString(),
    } as AgentMemory);

  const recentEpisodicEvents = await fetchRecentEpisodicEvents(userId);
  const episodicSummary = await summarizeEpisodicMemory(userId, recentEpisodicEvents);

  const steps: AgentStep[] = [];
  let currentIteration = 0;
  let loopFinished = false;
  let toolData: any = null;

  while (!loopFinished && currentIteration < MAX_ITERATIONS) {
    currentIteration++;
    const availableTools = activeRegistry.getAvailableTools();

    console.log('CALLING GROQ (decideNextStep)...');
    const decisionRes = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `
            You are an autonomous agent powered by Groq. Current Intent: ${intent}. Language: ${language}.
            TOOLS: ${availableTools.map((t) => `${t.id}: ${t.description}`).join('\n')}
            CONTEXT_ANALYSES: ${JSON.stringify(analyses)}
            CONTEXT_ALERTS: ${JSON.stringify(alerts)}
            MEMORY: ${JSON.stringify(memory)}
            RECENT_ACTIVITY: ${episodicSummary}
            DECIDE. JSON ONLY: {"thought": "...", "action": "tool_id|forge_tool|final", "input": {}, "final": "..."}
          `,
        },
        { role: 'user', content: input || 'Process current context.' },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });
    console.log('GROQ RESPONSE RECEIVED');

    const decision: Decision = JSON.parse(decisionRes.choices[0]?.message?.content || '{"action": "final"}');

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
        const observation = await tool.execute(decision.input || {}, { userId, imageUri });
        steps.push({ thought: decision.thought, action: decision.action, input: decision.input, observation });
        await addEpisodicEvent(userId, { input: decision.input, action: decision.action, observation });

        if (observation.leaks || observation.insights || observation.findings) {
          toolData = { ...toolData, ...observation };
        }
      } catch (err: any) {
        steps.push({ thought: decision.thought, action: decision.action, input: decision.input, observation: { error: err.message } });
      }
    }
  }

  const synthesisHistory = (history || [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role || 'user',
      content: m.content.trim(),
    }));

  console.log('CALLING GROQ (finalSynthesis)...');
  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `Synthesis in ${language}. Tool Results: ${JSON.stringify(steps)}. Respond directly to user based on these results. Mention identified savings or insights explicitly.`,
      },
      ...synthesisHistory.slice(-3),
      { role: 'user', content: input || 'Finalize.' },
    ],
    temperature: 0.2,
    stream: true,
  });
  console.log('GROQ RESPONSE RECEIVED');

  const metadata: AgentMetadata = {
    intent,
    plan: 'Reasoning Cycle Completed.',
    steps,
    memoryUsed: !!mainMemory,
    language,
    iterationCount: currentIteration,
    structuredData: toolData,
  };

  return { stream, metadata };
}
