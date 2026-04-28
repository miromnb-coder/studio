import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AgentMemoryCategory =
  | 'project'
  | 'preference'
  | 'decision'
  | 'personal_context'
  | 'do_not_repeat';

export type AgentMemoryRecord = {
  id: string;
  user_id: string;
  category: AgentMemoryCategory;
  memory_key: string;
  content: string;
  source_label: string;
  source_ref: string | null;
  confidence: number;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
};

export type ScoredAgentMemory = AgentMemoryRecord & {
  relevance: number;
  confidenceScore: number;
  score: number;
};

export type AgentMemoryWriteCandidate = {
  category: AgentMemoryCategory;
  content: string;
  sourceLabel: string;
  sourceRef?: string;
  confidence?: number;
};

const SMALL_TALK_PATTERN = /^(hi|hello|hey|thanks|thank you|ok|okay|cool|great|nice|yo|sup|good morning|good night)[!.\s]*$/i;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((token) => token.length >= 3)
    .slice(0, 80);
}

function computeOverlapScore(query: string, content: string): number {
  const q = new Set(tokenize(query));
  const c = new Set(tokenize(content));
  if (!q.size || !c.size) return 0;
  let matches = 0;
  for (const token of q) {
    if (c.has(token)) matches += 1;
  }
  return matches / Math.max(3, Math.min(q.size, 14));
}

function recencyBoost(updatedAt: string): number {
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  const ageDays = ageMs / 86_400_000;
  if (ageDays <= 1) return 0.15;
  if (ageDays <= 7) return 0.1;
  if (ageDays <= 30) return 0.05;
  return 0;
}

function categoryWeight(category: AgentMemoryCategory): number {
  switch (category) {
    case 'project':
      return 0.14;
    case 'preference':
      return 0.12;
    case 'decision':
      return 0.1;
    case 'personal_context':
      return 0.09;
    case 'do_not_repeat':
      return 0.13;
    default:
      return 0;
  }
}

function memoryKey(category: AgentMemoryCategory, content: string): string {
  return `${category}:${normalize(content).slice(0, 140)}`;
}

function isSmallTalk(input: string): boolean {
  return SMALL_TALK_PATTERN.test(input.trim()) || input.trim().length < 8;
}

export async function searchAgentMemory(
  supabase: SupabaseClient,
  input: { userId?: string; query: string; limit?: number },
): Promise<{ items: ScoredAgentMemory[]; used: boolean }> {
  if (!input.userId?.trim() || !input.query.trim()) return { items: [], used: false };

  const { data, error } = await supabase
    .from('kivo_agent_memories')
    .select('id,user_id,category,memory_key,content,source_label,source_ref,confidence,created_at,updated_at,last_used_at')
    .eq('user_id', input.userId)
    .is('archived_at', null)
    .order('updated_at', { ascending: false })
    .limit(220);

  if (error || !Array.isArray(data)) return { items: [], used: false };

  const scored = (data as AgentMemoryRecord[])
    .map((item) => {
      const relevance = Math.max(0, Math.min(1, computeOverlapScore(input.query, item.content) + recencyBoost(item.updated_at) + categoryWeight(item.category)));
      const confidenceScore = Math.max(0.2, Math.min(1, Number(item.confidence || 0.6)));
      const score = relevance * 0.75 + confidenceScore * 0.25;
      return { ...item, relevance, confidenceScore, score };
    })
    .filter((item) => item.relevance >= 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(2, Math.min(12, input.limit ?? 8)));

  if (scored.length) {
    const ids = scored.map((item) => item.id);
    await supabase.from('kivo_agent_memories').update({ last_used_at: new Date().toISOString() }).in('id', ids);
  }

  return { items: scored, used: scored.length > 0 };
}

export async function upsertAgentMemories(
  supabase: SupabaseClient,
  input: { userId?: string; candidates: AgentMemoryWriteCandidate[] },
): Promise<{ written: number; ignored: number }> {
  if (!input.userId?.trim() || !input.candidates.length) return { written: 0, ignored: input.candidates.length };

  const rows = input.candidates
    .filter((candidate) => candidate.content.trim().length >= 10)
    .map((candidate) => ({
      id: crypto.randomUUID(),
      user_id: input.userId,
      category: candidate.category,
      memory_key: memoryKey(candidate.category, candidate.content),
      content: candidate.content.trim().slice(0, 600),
      source_label: candidate.sourceLabel,
      source_ref: candidate.sourceRef ?? null,
      confidence: Math.max(0.35, Math.min(0.99, candidate.confidence ?? 0.74)),
      attributes: {},
      archived_at: null,
      updated_at: new Date().toISOString(),
    }));

  if (!rows.length) return { written: 0, ignored: input.candidates.length };

  const { error } = await supabase
    .from('kivo_agent_memories')
    .upsert(rows, { onConflict: 'user_id,memory_key', ignoreDuplicates: false });

  if (error) return { written: 0, ignored: input.candidates.length };
  return { written: rows.length, ignored: Math.max(0, input.candidates.length - rows.length) };
}

export function extractAgentMemoryCandidates(input: {
  userMessage: string;
  assistantAnswer?: string;
  sourceLabel: string;
}): AgentMemoryWriteCandidate[] {
  const userMessage = input.userMessage.trim();
  if (!userMessage || isSmallTalk(userMessage)) return [];

  const candidates: AgentMemoryWriteCandidate[] = [];
  const push = (category: AgentMemoryCategory, content: string, confidence = 0.76) => {
    const normalized = content.trim();
    if (!normalized || normalized.length < 10) return;
    candidates.push({
      category,
      content: normalized,
      confidence,
      sourceLabel: input.sourceLabel,
    });
  };

  const patterns: Array<{ regex: RegExp; category: AgentMemoryCategory; confidence?: number }> = [
    { regex: /(?:i(?:'m| am) building|working on|shipping)\s+(.+)/i, category: 'project', confidence: 0.87 },
    { regex: /(?:my goal is|goal:|i want to)\s+(.+)/i, category: 'project', confidence: 0.83 },
    { regex: /(?:i prefer|prefer to|please use)\s+(.+)/i, category: 'preference', confidence: 0.84 },
    { regex: /(?:we decided to|i decided to|decision:)\s+(.+)/i, category: 'decision', confidence: 0.82 },
    { regex: /(?:don'?t suggest|avoid|do not repeat|never suggest)\s+(.+)/i, category: 'do_not_repeat', confidence: 0.9 },
    { regex: /(?:every day|daily|every week|weekly|routine|habit)\s+(.+)/i, category: 'personal_context', confidence: 0.75 },
  ];

  for (const pattern of patterns) {
    const match = userMessage.match(pattern.regex);
    if (match?.[1]) push(pattern.category, match[1], pattern.confidence ?? 0.75);
  }

  if (/kivo|agent|memory|planner|orchestrator|next\.js|supabase/i.test(userMessage)) {
    push('project', userMessage, 0.78);
  }

  return candidates.slice(0, 6);
}

export function buildPersonalContextBrief(memories: ScoredAgentMemory[]): string {
  if (!memories.length) return 'No durable user context found.';
  const sections: Record<AgentMemoryCategory, string[]> = {
    project: [],
    preference: [],
    decision: [],
    personal_context: [],
    do_not_repeat: [],
  };

  for (const memory of memories.slice(0, 8)) {
    sections[memory.category].push(memory.content);
  }

  const lines = ['Personal Context Brief:'];
  if (sections.project.length) lines.push(`- Projects: ${sections.project.slice(0, 2).join(' | ')}`);
  if (sections.preference.length) lines.push(`- Preferences: ${sections.preference.slice(0, 2).join(' | ')}`);
  if (sections.decision.length) lines.push(`- Decisions: ${sections.decision.slice(0, 2).join(' | ')}`);
  if (sections.personal_context.length) lines.push(`- Personal context: ${sections.personal_context.slice(0, 2).join(' | ')}`);
  if (sections.do_not_repeat.length) lines.push(`- Do not repeat: ${sections.do_not_repeat.slice(0, 3).join(' | ')}`);
  return lines.join('\n');
}
