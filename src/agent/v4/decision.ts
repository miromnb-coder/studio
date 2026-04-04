import { callLLM } from "./llm";

export async function decideNextStep(context: any) {
  const prompt = `
You are an AI agent.

Context:
${JSON.stringify(context)}

Return JSON:
{
  "thought": "...",
  "action": "tool_name or final",
  "input": {},
  "final": "..."
}
`;

  return await callLLM(prompt);
}
