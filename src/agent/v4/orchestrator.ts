import { routeIntent } from "./router";
import { readMemory, writeMemory } from "./memory";
import { createPlan } from "./planner";
import { runLoop } from "./loop";
import { reflect } from "./reflection";
import { AgentState } from "./types";

export async function runAgentV5(input: string, userId: string) {
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
    output: finalStep,
    steps: state.steps,
    plan,
    toolsUsed: state.toolsUsed,
    reflection,
    intent,
  };
}
