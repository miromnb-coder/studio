import { AgentState } from "./types";
import { tools } from "./tools";
import { decideNextStep } from "./decision";

export async function runLoop(state: AgentState) {
  let iterations = 0;

  while (!state.done && iterations < 6) {
    iterations++;

    const decision = await decideNextStep({
      input: state.input,
      steps: state.steps,
      memory: state.memory,
      plan: state.plan,
    });

    state.steps.push({
      type: "think",
      content: decision.thought,
    });

    if (decision.action === "final") {
      state.steps.push({
        type: "final",
        content: decision.final,
      });
      state.done = true;
      break;
    }

    const tool = tools.find((t) => t.name === decision.action);

    if (!tool) continue;

    state.steps.push({
      type: "action",
      tool: tool.name,
      input: decision.input,
    });

    const result = await tool.execute(decision.input);

    state.toolsUsed.push(tool.name);

    state.steps.push({
      type: "observation",
      result,
    });
  }

  return state;
}
