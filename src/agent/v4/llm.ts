export async function callLLM(prompt: string): Promise<any> {
  const res = await fetch("/api/llm", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });

  return res.json();
}
