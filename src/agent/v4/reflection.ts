import { callLLM } from "./llm";

export async function reflect(state: any) {
  const prompt = `
Analyze the result:
${JSON.stringify(state.steps)}

Was this effective? Improve future behavior.
`;

  return await callLLM(prompt);
}
