import OpenAI from "openai";
import { buildKernelSystemPrompt } from "./system";
import { createAnswerCompletedEvent, createDeltaEvent, createDoneEvent, createErrorEvent, createLogEvent, createStatusEvent, createToolCallEvent, createToolResultEvent } from "./stream";
import { buildExecutionPlan, type KernelExecutionPlan } from "./planner";
import { executeKernelTools } from "./tool-executor";
import type { KernelDependencies, KernelRequest, KernelResponse, KernelToolEvent, KernelUsage, RunKernelOptions, RunKernelStreamOptions } from "./types";

type ToolResult = { tool: string; ok: boolean; summary: string; data?: Record<string, unknown> };
type Goal = "plan_today" | "calendar_check" | "inbox" | "finance" | "memory" | "kivo_build" | "research" | "general";

function getClient(apiKey?: string): OpenAI { const key = apiKey ?? process.env.OPENAI_API_KEY; if (!key) throw new Error("OPENAI_API_KEY is missing."); return new OpenAI({ apiKey: key }); }
function getModel(runtime?: KernelDependencies["runtime"]) { return runtime?.model ?? process.env.OPENAI_MODEL ?? "gpt-5.4-mini"; }
function getReasoningEffort(runtime?: KernelDependencies["runtime"]) { return runtime?.reasoningEffort ?? "medium"; }
function getMaxOutputTokens(runtime?: KernelDependencies["runtime"]) { return runtime?.maxOutputTokens ?? 1600; }
function coerceMode(mode?: KernelRequest["mode"]): "fast" | "agent" { return mode === "agent" ? "agent" : "fast"; }
function buildInputMessage(message: string) { return message.trim(); }
function extractUsage(response: any): KernelUsage | undefined { const usage = response?.usage; if (!usage) return undefined; return { inputTokens: typeof usage.input_tokens === "number" ? usage.input_tokens : undefined, outputTokens: typeof usage.output_tokens === "number" ? usage.output_tokens : undefined, totalTokens: typeof usage.total_tokens === "number" ? usage.total_tokens : undefined }; }
function buildToolEvent(partial: Partial<KernelToolEvent> & Pick<KernelToolEvent, "tool" | "title">): KernelToolEvent { return { id: crypto.randomUUID(), tool: partial.tool, title: partial.title, subtitle: partial.subtitle, status: partial.status ?? "running", output: partial.output }; }
function hasResult(results: ToolResult[], name: string) { return results.some((result) => result.tool === name); }

function goalOf(request: KernelRequest, plan: KernelExecutionPlan, results: ToolResult[]): Goal {
  const text = request.message.toLowerCase();
  if ((text.includes("today") || text.includes("päivä") || text.includes("plan my day")) && plan.tools.some((tool) => tool.startsWith("calendar."))) return "plan_today";
  if (hasResult(results, "gmail.finance_scan") || /subscription|receipt|invoice|charge|renewal|money|save|finance|tilaus|lasku|sääst/i.test(text)) return "finance";
  if (hasResult(results, "gmail.inbox_summary") || /gmail|email|inbox|mail|sähköposti/i.test(text)) return "inbox";
  if (hasResult(results, "calendar.today") || hasResult(results, "calendar.search") || /calendar|meeting|schedule|kalenteri|tapahtuma/i.test(text)) return "calendar_check";
  if (hasResult(results, "memory.search") || hasResult(results, "memory.write") || /remember|memory|context|muista|konteksti/i.test(text)) return "memory";
  if (/kivo|personal ai os|agent|repo|component|next\.js|typescript|build|implement|sovellus/i.test(text)) return "kivo_build";
  if (plan.useBuiltInWebSearch) return "research";
  return "general";
}

function finding(result: ToolResult): string {
  const data = result.data ?? {};
  if (result.tool === "calendar.today" || result.tool === "calendar.search") {
    const count = typeof data.count === "number" ? data.count : Array.isArray(data.events) ? data.events.length : undefined;
    if (count === 0) return `${result.tool}: no events found, so there may be open time.`;
    if (typeof count === "number") return `${result.tool}: found ${count} event${count === 1 ? "" : "s"}.`;
  }
  if (result.tool === "calendar.plan_day") {
    const count = typeof data.eventCount === "number" ? data.eventCount : undefined;
    return typeof count === "number" ? `calendar.plan_day: prepared day-planning context from ${count} event${count === 1 ? "" : "s"}.` : result.summary;
  }
  if (result.tool === "gmail.status") return data.connected ? "gmail.status: Gmail is connected." : "gmail.status: Gmail is disconnected, so inbox signals are unavailable.";
  if (result.tool === "gmail.inbox_summary") {
    const count = typeof data.emailsAnalyzed === "number" ? data.emailsAnalyzed : 0;
    return data.connected ? `gmail.inbox_summary: ${count} analyzed email${count === 1 ? "" : "s"} available from synced data.` : "gmail.inbox_summary: unavailable because Gmail is disconnected.";
  }
  if (result.tool === "gmail.finance_scan") {
    const subscriptions = typeof data.subscriptionsFound === "number" ? data.subscriptionsFound : 0;
    const savings = typeof data.estimatedMonthlySavings === "number" ? data.estimatedMonthlySavings : 0;
    return data.connected ? `gmail.finance_scan: ${subscriptions} subscription signal${subscriptions === 1 ? "" : "s"}; estimated monthly savings ${savings}.` : "gmail.finance_scan: unavailable because Gmail is disconnected.";
  }
  if (result.tool === "memory.search") {
    const notes = Array.isArray(data.notes) ? data.notes.length : 0;
    return notes ? `memory.search: found ${notes} relevant memory note${notes === 1 ? "" : "s"}.` : "memory.search: no strong stored memory found.";
  }
  if (result.tool === "memory.write") {
    const notes = Array.isArray(data.notes) ? data.notes.length : 0;
    return notes ? `memory.write: captured ${notes} memory candidate${notes === 1 ? "" : "s"}.` : "memory.write: no durable memory candidate detected.";
  }
  return `${result.tool}: ${result.summary}`;
}

function missing(results: ToolResult[]): string[] {
  return Array.from(new Set(results.filter((result) => !result.ok).map((result) => {
    if (result.tool.startsWith("gmail.")) return "Gmail data is unavailable or disconnected.";
    if (result.tool.startsWith("calendar.")) return "Calendar data is unavailable or disconnected.";
    if (result.tool.startsWith("memory.")) return "Persistent memory is limited.";
    return `${result.tool} failed: ${result.summary}`;
  })));
}

function directive(goal: Goal): string[] {
  const base = ["Start with the useful result.", "Use the findings as observations, not raw logs.", "If data is missing, explain it and give the best fallback.", "Give one concrete next action when useful."];
  if (goal === "plan_today") return [...base, "Create a practical day plan from calendar and task context.", "Mention the highest priority and the first action block."];
  if (goal === "finance") return [...base, "Lead with savings or subscription findings.", "Give one concrete money action, not broad finance advice."];
  if (goal === "inbox") return [...base, "Prioritize urgent or high-value follow-up.", "Separate what is known from what requires Gmail connection or sync."];
  if (goal === "kivo_build") return [...base, "Answer like a senior product engineer for Kivo.", "Give exact implementation direction and avoid broad brainstorming unless asked."];
  if (goal === "memory") return [...base, "Use memory carefully and do not overclaim what was stored."];
  if (goal === "research") return [...base, "Separate current/fresh information from stable reasoning."];
  return base;
}

function brief(request: KernelRequest, plan: KernelExecutionPlan, results: ToolResult[]) {
  const goal = goalOf(request, plan, results);
  const findings = results.map(finding);
  const missingContext = missing(results);
  const responseDirective = directive(goal);
  const text = [
    "Kivo Context Intelligence Brief:",
    `User goal: ${goal}`,
    `Mode: ${plan.mode}`,
    `Tools: ${plan.tools.length ? plan.tools.join(", ") : "none"}`,
    "Findings:",
    ...(findings.length ? findings.map((item) => `- ${item}`) : ["- No custom tool findings."]),
    "Missing context:",
    ...(missingContext.length ? missingContext.map((item) => `- ${item}`) : ["- No major missing context detected."]),
    "Response directive:",
    ...responseDirective.map((item) => `- ${item}`),
  ].join("\n");
  return { goal, findings, missingContext, responseDirective, text };
}

function buildToolContextBlock(request: KernelRequest, plan: KernelExecutionPlan, results: ToolResult[]): string {
  if (!results.length) return "";
  const context = brief(request, plan, results);
  return [context.text, "", "Raw tool results:", ...results.map((result, index) => [`${index + 1}. ${result.tool}`, `ok: ${String(result.ok)}`, `summary: ${result.summary}`, `data: ${JSON.stringify(result.data ?? {})}`].join("\n"))].join("\n\n");
}

function inputPayload(systemPrompt: string, userInput: string, toolContext: string) { return [{ role: "system", content: systemPrompt }, { role: "user", content: toolContext ? `${userInput}\n\n${toolContext}` : userInput }]; }
function getWebSearchTool() { return { type: "web_search" as const }; }
function countWebSearchCalls(response: any): number { const output = Array.isArray(response?.output) ? response.output : []; return output.filter((item: any) => item?.type === "web_search_call").length; }
function extractWebSources(response: any): Array<{ url?: string; title?: string }> { const output = Array.isArray(response?.output) ? response.output : []; const sources: Array<{ url?: string; title?: string }> = []; for (const item of output) { const actionSources = item?.action?.sources; if (!Array.isArray(actionSources)) continue; for (const source of actionSources) if (source && typeof source === "object") sources.push({ url: typeof source.url === "string" ? source.url : undefined, title: typeof source.title === "string" ? source.title : undefined }); } return sources; }
function extractTextFromResponse(response: any): string { if (typeof response?.output_text === "string" && response.output_text.trim()) return response.output_text.trim(); const output = Array.isArray(response?.output) ? response.output : []; const parts: string[] = []; for (const item of output) { if (item?.type !== "message") continue; const content = Array.isArray(item?.content) ? item.content : []; for (const block of content) { const text = typeof block?.text === "string" ? block.text : typeof block?.content === "string" ? block.content : ""; if (text.trim()) parts.push(text.trim()); } } return parts.join("\n\n").trim(); }

export async function runKernel(request: KernelRequest, deps: KernelDependencies = {}, options: RunKernelOptions = {}): Promise<KernelResponse> {
  const mode = coerceMode(request.mode);
  const client = getClient(deps.apiKey);
  const model = getModel(deps.runtime);
  const systemPrompt = buildKernelSystemPrompt({ mode });
  const userInput = buildInputMessage(request.message);
  if (!userInput) throw new Error("KernelRequest.message cannot be empty.");
  const plan = buildExecutionPlan(request);
  const toolResults = await executeKernelTools(plan.tools, request, { userId: request.userId, conversationId: request.conversationId });
  const context = brief(request, plan, toolResults);
  const response = await client.responses.create({ model, reasoning: { effort: getReasoningEffort(deps.runtime) }, max_output_tokens: getMaxOutputTokens(deps.runtime), input: inputPayload(systemPrompt, userInput, buildToolContextBlock(request, plan, toolResults)), tools: plan.useBuiltInWebSearch ? [getWebSearchTool()] : undefined, tool_choice: plan.useBuiltInWebSearch ? "auto" : undefined, include: plan.useBuiltInWebSearch ? ["web_search_call.action.sources"] : undefined }, { signal: options.signal });
  const answer = extractTextFromResponse(response);
  return { id: response.id, mode, answer, summary: answer.slice(0, 200), status: "completed", model, createdAt: new Date().toISOString(), usage: extractUsage(response), metadata: { conversationId: request.conversationId, userId: request.userId, intent: context.goal, toolsUsed: plan.tools, importantFindings: context.findings, missingContext: context.missingContext, responseDirective: context.responseDirective, toolResults, webSearchUsed: countWebSearchCalls(response) > 0, webSources: extractWebSources(response) } };
}

export async function* runKernelStream(request: KernelRequest, deps: KernelDependencies = {}, options: RunKernelStreamOptions = {}) {
  const mode = coerceMode(request.mode);
  const client = getClient(deps.apiKey);
  const model = getModel(deps.runtime);
  const systemPrompt = buildKernelSystemPrompt({ mode });
  const userInput = buildInputMessage(request.message);
  if (!userInput) throw new Error("KernelRequest.message cannot be empty.");
  let finalText = "";
  let finalId = crypto.randomUUID();
  let finalUsage: KernelUsage | undefined;
  let finalResponse: any = null;
  const startedAt = Date.now();
  try {
    yield createStatusEvent("starting");
    yield createLogEvent("Kernel stream started.");
    const plan = buildExecutionPlan(request);
    yield createStatusEvent("building_context");
    yield createLogEvent(`Planned ${plan.tools.length} custom tools. Built-in web search: ${plan.useBuiltInWebSearch ? "on" : "off"}.`);
    const customToolResults: ToolResult[] = [];
    for (const toolName of plan.tools) {
      const toolEvent = buildToolEvent({ tool: toolName, title: toolName, subtitle: "Executing Kivo tool" });
      yield createToolCallEvent(toolEvent);
      const [result] = await executeKernelTools([toolName], request, { userId: request.userId, conversationId: request.conversationId });
      customToolResults.push(result);
      yield createToolResultEvent({ ...toolEvent, status: result.ok ? "completed" : "failed", output: result.summary });
    }
    const context = brief(request, plan, customToolResults);
    yield createLogEvent(`Context goal inferred: ${context.goal}.`);
    const webSearchEvent = plan.useBuiltInWebSearch ? buildToolEvent({ tool: "web_search", title: "Searching web", subtitle: "Using OpenAI built-in web search" }) : null;
    if (webSearchEvent) yield createToolCallEvent(webSearchEvent);
    const generationTool = buildToolEvent({ tool: "response_generator", title: "Generating response", subtitle: "Streaming model output" });
    yield createStatusEvent("calling_model");
    yield createToolCallEvent(generationTool);
    const stream = await client.responses.create({ model, stream: true, reasoning: { effort: getReasoningEffort(deps.runtime) }, max_output_tokens: getMaxOutputTokens(deps.runtime), input: inputPayload(systemPrompt, userInput, buildToolContextBlock(request, plan, customToolResults)), tools: plan.useBuiltInWebSearch ? [getWebSearchTool()] : undefined, tool_choice: plan.useBuiltInWebSearch ? "auto" : undefined, include: plan.useBuiltInWebSearch ? ["web_search_call.action.sources"] : undefined }, { signal: options.signal });
    for await (const event of stream as any) {
      if (event?.type === "response.output_text.delta") { const delta = typeof event?.delta === "string" ? event.delta : typeof event?.text === "string" ? event.text : ""; if (!delta) continue; finalText += delta; yield createDeltaEvent(delta); continue; }
      if (event?.type === "response.completed") { finalResponse = event.response; finalId = event.response?.id ?? finalId; finalUsage = extractUsage(event.response); continue; }
      if (event?.type === "error") { const msg = event?.error?.message || event?.message || "OpenAI stream error."; yield createToolResultEvent({ ...generationTool, status: "failed", output: msg }); if (webSearchEvent) yield createToolResultEvent({ ...webSearchEvent, status: "failed", output: "Web search did not complete." }); yield createErrorEvent(msg); return; }
    }
    const webSearchCount = countWebSearchCalls(finalResponse);
    const webSources = extractWebSources(finalResponse);
    if (webSearchEvent) yield createToolResultEvent({ ...webSearchEvent, status: "completed", output: webSearchCount > 0 ? `Searched the web and consulted ${webSources.length || webSearchCount} sources.` : "Web search was available but not needed for the final answer." });
    const content = finalText.trim() || extractTextFromResponse(finalResponse) || "";
    yield createToolResultEvent({ ...generationTool, status: content ? "completed" : "failed", output: content ? `Generated ${content.length} chars` : "No response text was produced by the model." });
    const toolCount = plan.tools.length + (plan.useBuiltInWebSearch ? 1 : 0);
    yield createAnswerCompletedEvent({ content, metadata: { intent: context.goal, responseMode: "tool", execution: { intent: context.goal, forceMode: toolCount ? "execution" : "status", statusText: toolCount ? "Completed with context intelligence" : "Completed", toolCount } }, structuredData: { execution: { intent: context.goal, forceMode: toolCount ? "execution" : "status", statusText: toolCount ? "Completed with context intelligence" : "Completed", toolCount }, importantFindings: context.findings, missingContext: context.missingContext, responseDirective: context.responseDirective, toolsUsed: plan.tools, webSources }, toolResults: [...customToolResults, ...(plan.useBuiltInWebSearch ? [{ tool: "web_search", ok: true, summary: webSearchCount > 0 ? `Web search used with ${webSources.length || webSearchCount} consulted sources.` : "Web search available but not used by the model.", data: { callCount: webSearchCount, sources: webSources } }] : [])], metrics: { charCount: content.length, completionMs: Date.now() - startedAt } });
    const result: KernelResponse = { id: finalId, mode, answer: content, summary: content.slice(0, 200), status: "completed", model, createdAt: new Date().toISOString(), usage: finalUsage, metadata: { conversationId: request.conversationId, userId: request.userId, intent: context.goal, toolsUsed: plan.tools, importantFindings: context.findings, missingContext: context.missingContext, responseDirective: context.responseDirective, toolResults: customToolResults, webSearchUsed: webSearchCount > 0, webSources } };
    yield createDoneEvent(result);
    yield createStatusEvent("completed");
  } catch (error) { yield createErrorEvent(error instanceof Error ? error.message : "Unknown kernel error."); }
}
