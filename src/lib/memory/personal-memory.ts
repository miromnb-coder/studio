import type { SupabaseClient } from '@supabase/supabase-js';

export const PERSONAL_MEMORY_CATEGORIES = [
  'profile',
  'goals',
  'projects',
  'preferences',
  'decisions',
  'routines',
  'blockers',
  'opportunities',
  'unfinished_items',
] as const;

export type PersonalMemoryCategory = (typeof PERSONAL_MEMORY_CATEGORIES)[number];

export type LegacyMemoryType =
  | 'preference'
  | 'fact'
  | 'goal'
  | 'finance'
  | 'other';

export type PersonalMemoryType = PersonalMemoryCategory | LegacyMemoryType;

export type PersonalMemoryItem = {
  id: string;
  userId: string;
  content: string;
  type: PersonalMemoryType;
  importance: number;
  relevanceScore: number;
  createdAt: string;
  updatedAt?: string;
};

export type MemoryCandidate = {
  type: PersonalMemoryType;
  content: string;
  importance: number;
  confidence: number;
  source: 'user' | 'assistant';
};

const DO_NOT_SAVE_PATTERNS: RegExp[] = [
  /\b(hi|hello|thanks|thank you|good morning|good night|how are you)\b/i,
  /\b(what's up|sup|nice|cool|ok|okay|lol|haha)\b/i,
  /\b(my favorite color|random fact|trivia)\b/i,
];

const SENSITIVE_NOISE_PATTERNS: RegExp[] = [
  /\b(password|otp|one-time code|ssn|social security|credit card|cvv|bank account)\b/i,
  /\b(secret|private key|seed phrase|2fa)\b/i,
];

const RULES: Array<{
  type: PersonalMemoryType;
  regex: RegExp;
  confidence: number;
  importance: number;
}> = [
  { type: 'goals', regex: /\b(i want to|my goal|target|i need to save|i plan to save|objective)\b/i, confidence: 0.92, importance: 0.94 },
  { type: 'projects', regex: /\b(i[' ]?m building|working on|project|launch|roadmap|milestone|app|product)\b/i, confidence: 0.88, importance: 0.86 },
  { type: 'preferences', regex: /\b(i prefer|prefer|i like|i dislike|avoid|don[' ]?t want|short answers|concise)\b/i, confidence: 0.86, importance: 0.8 },
  { type: 'decisions', regex: /\b(decided|decision|we chose|i chose|confirmed plan|locked in)\b/i, confidence: 0.9, importance: 0.85 },
  { type: 'routines', regex: /\b(every day|daily|weekly|routine|habit|every monday|every morning)\b/i, confidence: 0.86, importance: 0.8 },
  { type: 'blockers', regex: /\b(blocked|stuck|constraint|can[' ]?t|cannot|too expensive|not enough time|problem)\b/i, confidence: 0.84, importance: 0.84 },
  { type: 'opportunities', regex: /\b(opportunity|could improve|quick win|leverage|upside|faster path)\b/i, confidence: 0.82, importance: 0.75 },
  { type: 'unfinished_items', regex: /\b(finish|resume|continue|left off|unfinished|pending|follow up)\b/i, confidence: 0.83, importance: 0.82 },
  { type: 'profile', regex: /\b(i am|i work as|my role|i live in|my timezone|my schedule)\b/i, confidence: 0.78, importance: 0.7 },
  { type: 'finance', regex: /\b(save|saving|budget|expense|subscription|bill|debt|money|cashflow)\b/i, confidence: 0.88, importance: 0.9 },
];

export function toPersonalMemoryType(raw: unknown): PersonalMemoryType {
  if (typeof raw !== 'string') return 'other';
  if ((PERSONAL_MEMORY_CATEGORIES as readonly string[]).includes(raw)) return raw as PersonalMemoryCategory;
  if (raw === 'preference' || raw === 'fact' || raw === 'goal' || raw === 'finance') return raw;
  return 'other';
}

function normalizeContent(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function sanitizeMemoryContent(value: string): string {
  return normalizeContent(value).replace(/[\n\r]+/g, ' ').slice(0, 320);
}

export function shouldStoreMemoryCandidate(text: string, confidence: number): boolean {
  const normalized = normalizeContent(text);
  if (!normalized || normalized.length < 14) return false;
  if (confidence < 0.8) return false;
  if (DO_NOT_SAVE_PATTERNS.some((pattern) => pattern.test(normalized))) return false;
  if (SENSITIVE_NOISE_PATTERNS.some((pattern) => pattern.test(normalized))) return false;
  return true;
}

export function extractMemoryCandidates(params: {
  userInput: string;
  assistantReply?: string;
}): MemoryCandidate[] {
  const candidates: MemoryCandidate[] = [];
  const inputs: Array<{ source: 'user' | 'assistant'; value: string }> = [
    { source: 'user', value: params.userInput || '' },
  ];

  if (params.assistantReply) {
    inputs.push({ source: 'assistant', value: params.assistantReply });
  }

  for (const input of inputs) {
    const text = normalizeContent(input.value);
    if (!text) continue;

    for (const rule of RULES) {
      if (!rule.regex.test(text)) continue;
      if (!shouldStoreMemoryCandidate(text, rule.confidence)) continue;

      candidates.push({
        type: rule.type,
        content: sanitizeMemoryContent(text),
        confidence: rule.confidence,
        importance: rule.importance,
        source: input.source,
      });
    }
  }

  return Array.from(
    new Map(
      candidates.map((candidate) => [
        `${candidate.type}:${candidate.content.toLowerCase()}`,
        candidate,
      ]),
    ).values(),
  ).slice(0, 4);
}

export function inferRelevantCategories(query: string): PersonalMemoryType[] {
  const normalized = query.toLowerCase();
  const categories = new Set<PersonalMemoryType>();

  if (/\b(save|saving|budget|money|expense|debt|cost|subscription|finance)\b/i.test(normalized)) {
    categories.add('goals');
    categories.add('finance');
    categories.add('blockers');
    categories.add('opportunities');
  }

  if (/\b(project|build|app|feature|launch|roadmap|sprint|product)\b/i.test(normalized)) {
    categories.add('projects');
    categories.add('unfinished_items');
    categories.add('decisions');
  }

  if (/\b(plan|planning|today|schedule|routine|weekly|daily|focus|priorit)\b/i.test(normalized)) {
    categories.add('routines');
    categories.add('unfinished_items');
    categories.add('goals');
  }

  if (/\b(prefer|style|tone|concise|language|avoid)\b/i.test(normalized)) {
    categories.add('preferences');
    categories.add('preference');
  }

  return Array.from(categories);
}

export async function persistPersonalMemoryCandidates(params: {
  supabase: SupabaseClient;
  userId: string;
  candidates: MemoryCandidate[];
}): Promise<number> {
  const { supabase, userId } = params;
  if (!userId || !params.candidates.length) return 0;

  let inserted = 0;

  for (const candidate of params.candidates) {
    const { data: existing } = await supabase
      .from('memory')
      .select('id,content,updated_at')
      .eq('user_id', userId)
      .eq('type', candidate.type)
      .order('updated_at', { ascending: false })
      .limit(12);

    const duplicate = (existing || []).some(
      (row: { content?: string | null }) =>
        String(row.content || '').trim().toLowerCase() ===
        candidate.content.trim().toLowerCase(),
    );

    if (duplicate) continue;

    const payload = {
      user_id: userId,
      content: candidate.content,
      type: candidate.type,
      importance: Number(candidate.importance.toFixed(2)),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('memory').insert(payload);
    if (!error) inserted += 1;
  }

  return inserted;
}
