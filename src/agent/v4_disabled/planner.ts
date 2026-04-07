import { callLLM } from "./llm";

export async function createPlan(input: string) {
  const prompt = `
Create a short execution plan for this task:
${input}

Return as array.
`;

  const res = await callLLM(prompt);
  return res.plan || [];
}
