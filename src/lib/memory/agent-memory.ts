import crypto from 'node:crypto';
import OpenAI from 'openai';
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
  reason?: string;
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

function charTrigrams(text: string): Set<string> {
  const n = normalize(text).replace(/\s+/g, ' ');
  if (n.length < 3) return new Set();
  const values = new Set<string>();
  for (let i = 0; i <= n.length - 3; i += 1) values.add(n.slice(i, i + 3));
  return values;
}

function trigramSimilarity(a: string, b: string): number {
  const first = charTrigrams(a);
  const second = charTrigrams(b);
  if (!first.size || !second.size) return 0;
  let intersection = 0;
  for (const item of first) {
    if (second.has(item)) intersection += 1;
  }
  return intersection / (first.size + second.size - intersection);
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

function buildMemoryKey(category: AgentMemoryCategory, content: string): string {
  const normalized = normalize(content).slice(0, 220);
  const digest = crypto.createHash('sha256').update(`${category}:${normalized}`).digest('hex').slice(0, 20);
  return `${category}:${digest}`;
}

function getMemoryClient() {
  const key = process.env.GROQ_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (process.env.GROQ_API_KEY) {
    return new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getMemoryModel() {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_MEMORY_MODEL ?? process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';
  return process.env.OPENAI_MEMORY_MODEL ?? 'gpt-4.1-mini';
}

type ExtractedMemory = {
  shouldStore: boolean;
  category: AgentMemoryCategory;
  content: string;
  confidence: number;
  reason: string;
};

const MEMORY_CATEGORIES: AgentMemoryCategory[] = ['project', 'preference', 'decision', 'personal_context', 'do_not_repeat'];
const MEMORY_MIN_CONFIDENCE = 0.7;

function looksLikeSmallTalk(text: string): boolean {
  const n = normalize(text);
  if (n.length < 12) return true;
  const tokens = n.split(' ').filter(Boolean);
  return tokens.length <= 2;
}

function buildExtractorPayload(input: {
  userMessage: string;
  assistantAnswer?: string;
  conversationContext?: string[];
}) {
  return [
    'Extract durable long-term user memory from multilingual chat.',
    'Store only if useful over future conversations.',
    'Return strict JSON only.',
    '',
    `User message: ${input.userMessage}`,
    input.assistantAnswer ? `Assistant response: ${input.assistantAnswer}` : 'Assistant response: (none)',
    input.conversationContext?.length ? `Conversation context:\n- ${input.conversationContext.slice(-4).join('\n- ')}` : 'Conversation context: (none)',
  ].join('\n');
}

async function extractMemoryWithModel(input: {
  userMessage: string;
  assistantAnswer?: string;
  conversationContext?: string[];
}): Promise<ExtractedMemory | null> {
  const client = getMemoryClient();
  if (!client) return null;

  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      shouldStore: { type: 'boolean' },
      category: { type: 'string', enum: MEMORY_CATEGORIES },
      content: { type: 'string' },
      confidence: { type: 'number' },
      reason: { type: 'string' },
    },
    required: ['shouldStore', 'category', 'content', 'confidence', 'reason'],
  };

  try {
    const response = await Promise.race([
      client.responses.create({
        model: getMemoryModel(),
        temperature: 0,
        max_output_tokens: 250,
        input: [
          {
            role: 'system',
            content:
              'You are a durable memory extractor for a personal AI assistant. Understand semantics across any language. Do not use keyword matching. Ignore greetings, filler, short-lived requests, and jokes.',
          },
          { role: 'user', content: buildExtractorPayload(input) },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'memory_extraction',
            schema,
            strict: true,
          },
        },
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('memory-extractor-timeout')), 2300)),
    ]);

    const raw = (response as any).output_text;
    if (typeof raw !== 'string' || !raw.trim()) return null;
    const parsed = JSON.parse(raw) as ExtractedMemory;
    if (!MEMORY_CATEGORIES.includes(parsed.category)) return null;
    return {
      shouldStore: Boolean(parsed.shouldStore),
      category: parsed.category,
      content: String(parsed.content || '').trim().slice(0, 600),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence || 0))),
      reason: String(parsed.reason || '').trim().slice(0, 200),
    };
  } catch {
    return null;
  }
}

function heuristicMemoryFallback(input: {
  userMessage: string;
  sourceLabel: string;
}): AgentMemoryWriteCandidate[] {
  const message = input.userMessage.trim();
  if (!message || looksLikeSmallTalk(message)) return [];
  if (message.length < 24) return [];
  return [
    {
      category: 'personal_context',
      content: message.slice(0, 420),
      confidence: 0.72,
      sourceLabel: input.sourceLabel,
      reason: 'Fallback long-form personal context capture.',
    },
  ];
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
      const lexical = computeOverlapScore(input.query, item.content);
      const semantic = trigramSimilarity(input.query, item.content);
      const relevance = Math.max(0, Math.min(1, lexical * 0.45 + semantic * 0.35 + recencyBoost(item.updated_at) + categoryWeight(item.category)));
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

  const { data: existing } = await supabase
    .from('kivo_agent_memories')
    .select('id,category,content,confidence,memory_key')
    .eq('user_id', input.userId)
    .is('archived_at', null)
    .order('updated_at', { ascending: false })
    .limit(120);

  const existingRows = Array.isArray(existing) ? (existing as Array<{ id: string; category: AgentMemoryCategory; content: string; confidence: number; memory_key: string }>) : [];
  const upserts: Array<Record<string, unknown>> = [];
  let ignored = 0;
  let writes = 0;

  for (const candidate of input.candidates.slice(0, 3)) {
    const content = candidate.content.trim().slice(0, 600);
    const confidence = Math.max(0.35, Math.min(0.99, candidate.confidence ?? 0.74));
    if (content.length < 10 || confidence < MEMORY_MIN_CONFIDENCE || looksLikeSmallTalk(content)) {
      ignored += 1;
      continue;
    }
    const duplicate = existingRows.find((row) => {
      if (row.category !== candidate.category) return false;
      const lexical = trigramSimilarity(row.content, content);
      const normalizedEqual = normalize(row.content) === normalize(content);
      return normalizedEqual || lexical >= 0.9;
    });

    if (duplicate) {
      const replacement = content.length > duplicate.content.length || confidence > Number(duplicate.confidence || 0);
      if (!replacement) {
        ignored += 1;
        continue;
      }
      upserts.push({
        id: duplicate.id,
        user_id: input.userId,
        category: candidate.category,
        memory_key: duplicate.memory_key || buildMemoryKey(candidate.category, content),
        content,
        source_label: candidate.sourceLabel,
        source_ref: candidate.sourceRef ?? null,
        confidence,
        attributes: {
          reason: candidate.reason ?? null,
          replaced_at: new Date().toISOString(),
        },
        archived_at: null,
      });
      writes += 1;
      continue;
    }

    upserts.push({
      id: crypto.randomUUID(),
      user_id: input.userId,
      category: candidate.category,
      memory_key: buildMemoryKey(candidate.category, content),
      content,
      source_label: candidate.sourceLabel,
      source_ref: candidate.sourceRef ?? null,
      confidence,
      attributes: {
        reason: candidate.reason ?? null,
      },
      archived_at: null,
      updated_at: new Date().toISOString(),
    });
    writes += 1;
  }

  if (!upserts.length) return { written: 0, ignored: Math.max(input.candidates.length, ignored) };

  const { error } = await supabase
    .from('kivo_agent_memories')
    .upsert(upserts, { onConflict: 'user_id,memory_key', ignoreDuplicates: false });

  if (error) return { written: 0, ignored: input.candidates.length };
  return { written: writes, ignored: Math.max(0, input.candidates.length - writes) + ignored };
}

export async function extractAgentMemoryCandidates(input: {
  userMessage: string;
  assistantAnswer?: string;
  sourceLabel: string;
  conversationContext?: string[];
}): Promise<AgentMemoryWriteCandidate[]> {
  const userMessage = input.userMessage.trim();
  if (!userMessage || looksLikeSmallTalk(userMessage)) return [];

  const extracted = await extractMemoryWithModel({
    userMessage: input.userMessage,
    assistantAnswer: input.assistantAnswer,
    conversationContext: input.conversationContext,
  });

  if (extracted && extracted.shouldStore && extracted.confidence >= MEMORY_MIN_CONFIDENCE && extracted.content.length >= 10 && !looksLikeSmallTalk(extracted.content)) {
    return [
      {
        category: extracted.category,
        content: extracted.content,
        confidence: extracted.confidence,
        sourceLabel: input.sourceLabel,
        reason: extracted.reason,
      },
    ];
  }

  return heuristicMemoryFallback({ userMessage: input.userMessage, sourceLabel: input.sourceLabel });
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
