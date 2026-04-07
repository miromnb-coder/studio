import { routeIntent } from "./router";
import { readMemory, writeMemory } from "./memory";
import { createPlan } from "./planner";
import { runLoop } from "./loop";
import { reflect } from "./reflection";
import { AgentState } from "./types";

/**
 * @fileOverview Orchestrator v4 Compatibility Layer.
 */

export async function runAgentV4(input: string, userId: string, history: any[] = [], imageUri?: string) {
  const intent = routeIntent(input);
  const memory = await readMemory(userId);
  const plan = await createPlan(input);

  let state: AgentState = {
    input,
    steps: [],
    memory,
    plan,
    toolsUsed: [],
    done: false,
  };

  state = await runLoop(state);

  const reflection = await reflect(state);

  const finalStep = state.steps.find((s) => s.type === "final");

  await writeMemory(userId, {
    input,
    result: finalStep,
    reflection,
  });

  return {
    content: finalStep?.content || "Analysis finalized.",
    data: {
      title: intent.toUpperCase() + " Audit",
      strategy: reflection?.content || "Proceed with caution.",
      steps: state.steps,
      toolsUsed: state.toolsUsed
    },
    intent,
    mode: intent === 'money' ? 'analyst' : 'general',
    isActionable: true
  };
}
