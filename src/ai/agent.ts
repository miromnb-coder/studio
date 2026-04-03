import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

type Intent =
  | "finance"
  | "general"
  | "technical"
  | "analysis"
  | "time"
  | "monetization";

type Step = {
  action: string;
  input?: string;
};

type AgentState = {
  input: string;
  intent: Intent;
  steps: any[];
  memory: Record<string, any>;
};

//
// 🧠 1. INTENT DETECTION (AI + fallback)
//
async function detectIntent(input: string): Promise<Intent> {
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Classify intent: finance, general, technical, analysis, time, monetization.\n\n${input}`,
        },
      ],
    });

    const out = res.choices[0]?.message?.content?.toLowerCase() || "";

    if (out.includes("finance")) return "finance";
    if (out.includes("technical")) return "technical";
    if (out.includes("analysis")) return "analysis";
    if (out.includes("time")) return "time";
    if (out.includes("monetization")) return "monetization";

    return "general";
  } catch {
    return "general";
  }
}

//
// 🧩 2. PLANNER (multi-step)
//
async function createPlan(state: AgentState): Promise<Step[]> {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `
User input: ${state.input}
Intent: ${state.intent}

Create a step-by-step plan.

Return ONLY JSON array:
[
  { "action": "analyze" },
  { "action": "detect_leaks" },
  { "action": "suggest_actions" }
]
`,
      },
    ],
  });

  try {
    return JSON.parse(res.choices[0].message.content);
  } catch {
    return [{ action: "respond" }];
  }
}

//
// 🛠️ 3. TOOLS
//
async function analyze(input: string) {
  return `Analysis of: ${input}`;
}

async function detectLeaks(input: string) {
  return `Possible leaks found in: ${input}`;
}

async function suggestActions(input: string) {
  return `Suggested improvements for: ${input}`;
}

//
// ⚙️ 4. TOOL EXECUTOR
//
async function executeStep(step: Step, state: AgentState) {
  switch (step.action) {
    case "analyze":
      return await analyze(state.input);

    case "detect_leaks":
      return await detectLeaks(state.input);

    case "suggest_actions":
      return await suggestActions(state.input);

    default:
      return runLLM(`Handle step: ${step.action}`, state.input);
  }
}

//
// 🧠 5. GENERIC LLM CALL
//
async function runLLM(instruction: string, input: string) {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: instruction,
      },
      {
        role: "user",
        content: input,
      },
    ],
  });

  return res.choices[0]?.message?.content || "";
}

//
// 🧠 6. FINAL RESPONSE
//
async function summarize(state: AgentState) {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `
User input: ${state.input}

Steps executed:
${JSON.stringify(state.steps, null, 2)}

Give the best final answer.
`,
      },
    ],
  });

  return res.choices[0]?.message?.content || "No response";
}

//
// 💾 7. MEMORY (simple)
//
function updateMemory(state: AgentState) {
  state.memory.lastInput = state.input;
}

//
// 🚀 8. MAIN AGENT LOOP
//
export async function runAgent(input: string) {
  const state: AgentState = {
    input,
    intent: "general",
    steps: [],
    memory: {},
  };

  // 1. intent
  state.intent = await detectIntent(input);

  // 2. plan
  const plan = await createPlan(state);

  // 3. execute steps
  for (const step of plan) {
    const result = await executeStep(step, state);
    state.steps.push({ step, result });
  }

  // 4. memory update
  updateMemory(state);

  // 5. final answer
  return await summarize(state);
}
