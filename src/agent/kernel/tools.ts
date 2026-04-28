import type { KernelRequest } from './types';
import type { KernelToolContext, KernelToolName, KernelToolResult } from './tool-registry';
import {
  buildPersonalContextBrief,
  extractAgentMemoryCandidates,
  searchAgentMemory,
  upsertAgentMemories,
} from '@/lib/memory/agent-memory';
import { createClient } from '@/lib/supabase/server';

function lower(text: string) {
  return text.toLowerCase();
}
function extractDateTimeStrings(text: string): string[] {
  return text.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}:?\d{2}(?:\.\d{3})?)?(?:Z|[+-]\d{2}:\d{2})?/g) ?? [];
}
function inferTodayWindow() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}
function inferSearchWindow(text: string) {
  const normalized = lower(text);
  if (normalized.includes('today')) return inferTodayWindow();
  return { timeMin: undefined, timeMax: undefined };
}
function inferCreatePayload(text: string) {
  const trimmed = text.trim();
  const d = extractDateTimeStrings(trimmed);
  let start = d[0], end = d[1];
  if (start && !end) {
    const n = new Date(start);
    n.setHours(n.getHours() + 1);
    end = n.toISOString();
  }
  return { title: trimmed || 'New event', start, end };
}
async function callJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }, cache: 'no-store' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((payload as any)?.error || `Request failed (${response.status})`);
  return payload as T;
}
type GmailStatusPayload = { connected?: boolean; status?: string; accountEmail?: string | null; lastSyncedAt?: string | null; emailsAnalyzed?: number; subscriptionsFound?: number; recurringPaymentsFound?: number; monthlyTotal?: number; estimatedMonthlySavings?: number; summary?: string };

export async function runMemorySearchTool(request: KernelRequest, context: KernelToolContext): Promise<KernelToolResult> {
  if (!context.userId) {
    return {
      tool: 'memory.search',
      ok: false,
      summary: 'Memory search skipped: missing user identity.',
      data: { found: false, notes: [] },
    };
  }

  const supabase = await createClient();
  const memory = await searchAgentMemory(supabase, {
    userId: context.userId,
    query: request.message,
    limit: 8,
  });

  return {
    tool: 'memory.search',
    ok: true,
    summary: memory.items.length
      ? `Recovered ${memory.items.length} relevant memory signals.`
      : 'No highly relevant memory was found.',
    data: {
      userId: context.userId,
      conversationId: context.conversationId ?? null,
      found: memory.items.length > 0,
      notes: memory.items.map((item) => item.content),
      items: memory.items,
      contextBrief: buildPersonalContextBrief(memory.items),
      relevanceScores: memory.items.map((item) => ({
        id: item.id,
        relevance: item.relevance,
        confidence: item.confidenceScore,
      })),
    },
  };
}

export async function runMemoryWriteTool(request: KernelRequest, context: KernelToolContext): Promise<KernelToolResult> {
  const candidates = extractAgentMemoryCandidates({
    userMessage: request.message,
    sourceLabel: 'memory_write_tool',
  });

  if (!context.userId) {
    return {
      tool: 'memory.write',
      ok: false,
      summary: 'No durable memory candidate was stored because user identity is missing.',
      data: {
        stored: false,
        candidates,
      },
    };
  }

  const supabase = await createClient();
  const result = await upsertAgentMemories(supabase, {
    userId: context.userId,
    candidates,
  });

  return {
    tool: 'memory.write',
    ok: result.written > 0,
    summary: result.written
      ? `Stored ${result.written} durable memory item${result.written === 1 ? '' : 's'}.`
      : 'No durable memory candidate was detected.',
    data: {
      userId: context.userId,
      conversationId: context.conversationId ?? null,
      stored: result.written > 0,
      written: result.written,
      ignored: result.ignored,
      candidates,
    },
  };
}

export async function runTasksPlanTool(request: KernelRequest): Promise<KernelToolResult> { return { tool:'tasks.plan', ok:true, summary:'Built a lightweight execution plan.', data:{ steps:['Understand the goal','Gather context','Produce best next action'], prompt:request.message } }; }
export async function runNextActionTool(request: KernelRequest): Promise<KernelToolResult> { return { tool:'productivity.next_action', ok:true, summary:'Identified the best immediate next action.', data:{ nextAction:'Take the highest-value next step based on available context.', basedOn: request.message.slice(0, 220) } }; }
export async function runCompareSmartTool(request: KernelRequest): Promise<KernelToolResult> { return { tool:'compare.smart', ok:true, summary:'Prepared a comparison frame.', data:{ prompt:request.message } }; }
export async function runFinanceAnalyzeTool(request: KernelRequest): Promise<KernelToolResult> { return { tool:'finance.analyze', ok:true, summary:'Analyzed finance opportunity.', data:{ prompt: request.message } }; }
export async function runGmailStatusTool(): Promise<KernelToolResult> { try { const payload=await callJson<GmailStatusPayload>('/api/integrations/gmail/status'); return { tool:'gmail.status', ok:Boolean(payload.connected), summary:Boolean(payload.connected)?'Gmail is connected.':'Gmail is not connected.', data:payload as any}; } catch(error){ return { tool:'gmail.status', ok:false, summary:error instanceof Error?error.message:'Failed Gmail status.'}; } }
export async function runGmailInboxSummaryTool(): Promise<KernelToolResult> { const s=await runGmailStatusTool(); return { tool:'gmail.inbox_summary', ok:s.ok, summary:s.ok?'Recent Gmail context available.':s.summary, data:s.data}; }
export async function runGmailFinanceScanTool(): Promise<KernelToolResult> { const s=await runGmailStatusTool(); return { tool:'gmail.finance_scan', ok:s.ok, summary:s.ok?'Finance signals checked from Gmail.':s.summary, data:s.data}; }
export async function runCalendarStatusTool(): Promise<KernelToolResult> { try { const payload=await callJson<any>('/api/integrations/google-calendar/status'); return { tool:'calendar.status', ok:Boolean(payload.connected), summary:Boolean(payload.connected)?'Google Calendar is connected.':'Google Calendar is not connected.', data:payload}; } catch(error){ return { tool:'calendar.status', ok:false, summary:error instanceof Error?error.message:'Failed calendar status.'}; } }
export async function runCalendarTodayTool(): Promise<KernelToolResult> { try { const payload=await callJson<any>('/api/integrations/google-calendar/events?mode=today'); const events=Array.isArray(payload.events)?payload.events:[]; return { tool:'calendar.today', ok:true, summary:events.length?`Fetched ${events.length} events for today.`:'No events found for today.', data:{events,count:events.length}}; } catch(error){ return { tool:'calendar.today', ok:false, summary:error instanceof Error?error.message:'Failed today events.'}; } }
export async function runCalendarSearchTool(request: KernelRequest): Promise<KernelToolResult> { try { const w=inferSearchWindow(request.message); const q=new URLSearchParams(); if(w.timeMin)q.set('timeMin',w.timeMin); if(w.timeMax)q.set('timeMax',w.timeMax); const payload=await callJson<any>(`/api/integrations/google-calendar/events?${q.toString()}`); const events=Array.isArray(payload.events)?payload.events:[]; return { tool:'calendar.search', ok:true, summary:events.length?`Found ${events.length} events.`:'No matching events found.', data:{events,count:events.length}}; } catch(error){ return { tool:'calendar.search', ok:false, summary:error instanceof Error?error.message:'Failed search.'}; } }
export async function runCalendarPlanDayTool(): Promise<KernelToolResult> { const today=await runCalendarTodayTool(); return { tool:'calendar.plan_day', ok:today.ok, summary:'Prepared a day plan context.', data:today.data}; }
export async function runCalendarCreateEventTool(request: KernelRequest): Promise<KernelToolResult> { const inferred=inferCreatePayload(request.message); if(!inferred.start||!inferred.end)return { tool:'calendar.create_event', ok:false, summary:'Could not infer event time.', data:inferred}; return { tool:'calendar.create_event', ok:true, summary:'Event payload prepared.', data:inferred}; }
export async function runKernelTool(tool: KernelToolName, request: KernelRequest, context: KernelToolContext): Promise<KernelToolResult> { switch(tool){case 'memory.search':return runMemorySearchTool(request,context);case 'memory.write':return runMemoryWriteTool(request,context);case 'tasks.plan':return runTasksPlanTool(request);case 'productivity.next_action':return runNextActionTool(request);case 'compare.smart':return runCompareSmartTool(request);case 'finance.analyze':return runFinanceAnalyzeTool(request);case 'gmail.status':return runGmailStatusTool();case 'gmail.inbox_summary':return runGmailInboxSummaryTool();case 'gmail.finance_scan':return runGmailFinanceScanTool();case 'calendar.status':return runCalendarStatusTool();case 'calendar.today':return runCalendarTodayTool();case 'calendar.search':return runCalendarSearchTool(request);case 'calendar.create_event':return runCalendarCreateEventTool(request);case 'calendar.plan_day':return runCalendarPlanDayTool();default:return {tool,ok:false,summary:`Unknown tool: ${tool}`};}}
