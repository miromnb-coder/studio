import { groq } from '@/ai/groq';
import type { FinanceActionType, FinanceAnalysis } from '@/lib/finance/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type MemoryIntent = 'finance' | 'general';

export interface MemoryEventRecord {
  event_type: string;
  title?: string | null;
  summary?: string | null;
  data?: Record<string, unknown> | null;
  created_at?: string | null;
}

export interface FinanceProfileRecord {
  user_id: string;
  active_subscriptions?: Array<Record<string, unknown>> | null;
  estimated_savings?: number | null;
  currency?: string | null;
  last_analysis?: Record<string, unknown> | null;
  updated_at?: string | null;
}

export interface RetrievedMemoryContext {
  userId: string;
  summary: string;
  summaryType: MemoryIntent;
  financeProfile?: FinanceProfileRecord | null;
  financeEvents?: MemoryEventRecord[];
  summaries?: Array<{ summary_type: string; summary_text: string }>;
}

function normalizeMerchantKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function concise(text: string, max = 280): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function sanitizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildFinanceSummary(profile: FinanceProfileRecord | null, events: MemoryEventRecord[]): string {
  const subs = Array.isArray(profile?.active_subscriptions) ? profile!.active_subscriptions : [];
  const topSubs = subs
    .slice(0, 5)
    .map((sub) => String(sub?.merchant || sub?.name || 'unknown service'))
    .filter(Boolean);

  const eventSnippets = events
    .slice(0, 3)
    .map((event) => event.summary || event.title)
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => concise(item, 120));

  const parts = [
    profile?.currency ? `Currency: ${profile.currency}.` : null,
    typeof profile?.estimated_savings === 'number' ? `Estimated monthly savings: ${Math.round(profile.estimated_savings)}.` : null,
    topSubs.length ? `Active subscriptions: ${topSubs.join(', ')}.` : null,
    eventSnippets.length ? `Recent finance events: ${eventSnippets.join(' | ')}.` : null,
  ].filter((item): item is string => !!item);

  return parts.join(' ') || 'No finance memory available yet.';
}

function buildGeneralSummary(summaries: Array<{ summary_type: string; summary_text: string }>): string {
  const ordered = summaries
    .slice(0, 4)
    .map((row) => `${row.summary_type}: ${concise(row.summary_text, 180)}`);
  return ordered.join(' | ') || 'No prior context available.';
}

export async function detectMemoryIntent(input: string): Promise<MemoryIntent> {
  const lower = input.toLowerCase();
  if (/budget|expense|spend|subscription|savings|invoice|cost|bill|cancel|price/.test(lower)) {
    return 'finance';
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Classify user intent as finance or general only. Return JSON {"intent":"finance|general"}.',
        },
        { role: 'user', content: input || 'General request.' },
      ],
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}') as { intent?: string };
    return parsed.intent === 'finance' ? 'finance' : 'general';
  } catch {
    return 'general';
  }
}

export async function retrieveRelevantMemory(
  supabase: SupabaseClient,
  userId: string,
  intent: MemoryIntent,
): Promise<RetrievedMemoryContext> {
  if (intent === 'finance') {
    const [profileResult, eventsResult] = await Promise.all([
      supabase.from('finance_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase
        .from('memory_events')
        .select('event_type,title,summary,data,created_at')
        .eq('user_id', userId)
        .in('event_type', ['finance_analysis', 'savings_plan_created', 'alternatives_generated', 'cancellation_draft_created'])
        .order('created_at', { ascending: false })
        .limit(12),
    ]);

    const profile = (profileResult.data || null) as FinanceProfileRecord | null;
    const events = (eventsResult.data || []) as MemoryEventRecord[];

    return {
      userId,
      summaryType: 'finance',
      summary: buildFinanceSummary(profile, events),
      financeProfile: profile,
      financeEvents: events,
    };
  }

  const summariesResult = await supabase
    .from('memory_summaries')
    .select('summary_type,summary_text')
    .eq('user_id', userId)
    .in('summary_type', ['user_profile', 'finance_summary', 'general_summary'])
    .order('updated_at', { ascending: false })
    .limit(4);

  const summaries = (summariesResult.data || []) as Array<{ summary_type: string; summary_text: string }>;

  return {
    userId,
    summaryType: 'general',
    summary: buildGeneralSummary(summaries),
    summaries,
  };
}

interface MemoryExtractionInput {
  intent: MemoryIntent;
  userInput: string;
  assistantReply: string;
  finance: FinanceAnalysis | null;
  actionType?: FinanceActionType | null;
}

interface MemoryExtraction {
  importantEvents: Array<{
    eventType: string;
    title: string;
    summary: string;
    data?: Record<string, unknown>;
  }>;
  financeProfilePatch?: Partial<FinanceProfileRecord>;
  summaries: Array<{ summaryType: string; summaryText: string }>;
}

async function extractGeneralFacts(userInput: string, assistantReply: string) {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Extract only high-signal memory. Ignore casual chat. Return JSON {"facts":[{"text":"...","score":0-1}],"summary":"..."}.',
        },
        {
          role: 'user',
          content: `User: ${userInput}\nAssistant: ${assistantReply}`,
        },
      ],
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}') as {
      facts?: Array<{ text?: string; score?: number }>;
      summary?: string;
    };

    const facts = (parsed.facts || [])
      .filter((fact) => (fact.score ?? 0) >= 0.72 && typeof fact.text === 'string' && fact.text.trim().length > 8)
      .slice(0, 3)
      .map((fact) => concise(fact.text || '', 180));

    return {
      facts,
      summary: typeof parsed.summary === 'string' ? concise(parsed.summary, 220) : '',
    };
  } catch {
    return { facts: [], summary: '' };
  }
}

export async function extractImportantMemory(input: MemoryExtractionInput): Promise<MemoryExtraction> {
  if (input.intent === 'finance' && input.finance) {
    const leaks = input.finance.leaks || [];
    const subscriptions = leaks
      .filter((leak) => leak.type === 'subscription' || leak.type === 'price_increase')
      .map((leak) => ({
        merchant: leak.merchant,
        amount: leak.amount,
        period: leak.period,
        urgency: leak.urgency,
        reason: leak.reason,
        last_seen_at: new Date().toISOString(),
      }));

    const events: MemoryExtraction['importantEvents'] = [];

    if (leaks.length > 0) {
      events.push({
        eventType: 'finance_analysis',
        title: 'Finance analysis completed',
        summary: concise(`Detected ${leaks.length} potential savings leaks with ${input.finance.confidence} confidence.`),
        data: {
          estimatedMonthlySavings: input.finance.estimatedMonthlySavings,
          currency: input.finance.currency,
          leakCount: leaks.length,
          topMerchants: leaks.slice(0, 5).map((leak) => leak.merchant),
        },
      });
    }

    if (input.actionType === 'create_savings_plan') {
      events.push({
        eventType: 'savings_plan_created',
        title: 'Savings plan created',
        summary: 'Generated a savings plan focused on top recurring leaks.',
      });
    }
    if (input.actionType === 'find_alternatives') {
      events.push({
        eventType: 'alternatives_generated',
        title: 'Alternatives generated',
        summary: 'Generated lower-cost alternatives for expensive services.',
      });
    }
    if (input.actionType === 'draft_cancellation') {
      events.push({
        eventType: 'cancellation_draft_created',
        title: 'Cancellation draft prepared',
        summary: 'Prepared a cancellation draft for a high-cost subscription.',
      });
    }

    return {
      importantEvents: events,
      financeProfilePatch: {
        active_subscriptions: subscriptions,
        estimated_savings: input.finance.estimatedMonthlySavings,
        currency: input.finance.currency || 'USD',
        last_analysis: {
          analyzed_at: new Date().toISOString(),
          recommendations: input.finance.recommendations,
          confidence: input.finance.confidence,
          leak_count: leaks.length,
        },
      },
      summaries: [
        {
          summaryType: 'finance_summary',
          summaryText: concise(
            `Finance state: ${leaks.length} leak(s), est. monthly savings ${input.finance.estimatedMonthlySavings ?? 0} ${input.finance.currency || 'USD'}.`,
            220,
          ),
        },
      ],
    };
  }

  const general = await extractGeneralFacts(input.userInput, input.assistantReply);

  const importantEvents = general.facts.map((fact) => ({
    eventType: 'important_decision',
    title: 'Important user context captured',
    summary: fact,
    data: { source: 'general_dialogue' },
  }));

  return {
    importantEvents,
    summaries: [
      {
        summaryType: 'user_profile',
        summaryText: general.summary || concise(input.userInput, 180),
      },
    ],
  };
}

function mergeSubscriptions(
  existing: Array<Record<string, unknown>>,
  incoming: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  const merged = new Map<string, Record<string, unknown>>();

  for (const item of existing) {
    const merchant = String(item?.merchant || item?.name || '').trim();
    if (!merchant) continue;
    merged.set(normalizeMerchantKey(merchant), { ...item, merchant });
  }

  for (const item of incoming) {
    const merchant = String(item?.merchant || item?.name || '').trim();
    if (!merchant) continue;

    const key = normalizeMerchantKey(merchant);
    const current = merged.get(key) || {};
    merged.set(key, {
      ...current,
      ...item,
      merchant,
      updated_at: new Date().toISOString(),
    });
  }

  return Array.from(merged.values());
}

async function eventExists(
  supabase: SupabaseClient,
  userId: string,
  eventType: string,
  summary: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('memory_events')
    .select('id,summary,created_at')
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .order('created_at', { ascending: false })
    .limit(8);

  if (!Array.isArray(data)) return false;
  return data.some((row) => String(row.summary || '').trim().toLowerCase() === summary.trim().toLowerCase());
}

export async function persistSmartMemory(
  supabase: SupabaseClient,
  userId: string,
  extracted: MemoryExtraction,
  existingFinanceProfile?: FinanceProfileRecord | null,
) {
  if (!userId) return;

  if (extracted.financeProfilePatch) {
    const nextSubscriptions = mergeSubscriptions(
      Array.isArray(existingFinanceProfile?.active_subscriptions) ? existingFinanceProfile!.active_subscriptions! : [],
      Array.isArray(extracted.financeProfilePatch.active_subscriptions)
        ? extracted.financeProfilePatch.active_subscriptions!
        : [],
    );

    await supabase.from('finance_profiles').upsert(
      {
        user_id: userId,
        active_subscriptions: nextSubscriptions,
        estimated_savings: extracted.financeProfilePatch.estimated_savings ?? null,
        currency: extracted.financeProfilePatch.currency ?? existingFinanceProfile?.currency ?? 'USD',
        last_analysis: extracted.financeProfilePatch.last_analysis ?? existingFinanceProfile?.last_analysis ?? {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
  }

  for (const event of extracted.importantEvents) {
    if (!event.summary?.trim()) continue;
    const duplicate = await eventExists(supabase, userId, event.eventType, event.summary);
    if (duplicate) continue;

    await supabase.from('memory_events').insert({
      user_id: userId,
      event_type: event.eventType,
      title: concise(event.title, 120),
      summary: concise(event.summary, 240),
      data: event.data || {},
      importance: 0.8,
      created_at: new Date().toISOString(),
    });
  }

  for (const summary of extracted.summaries) {
    if (!summary.summaryText?.trim()) continue;

    await supabase.from('memory_summaries').upsert(
      {
        user_id: userId,
        summary_type: summary.summaryType,
        summary_text: concise(summary.summaryText, 320),
        source: 'agent_v7',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,summary_type' },
    );
  }
}

export function pickImportantSignals(finance: FinanceAnalysis | null): string[] {
  if (!finance) return [];
  const signals = [
    ...finance.leaks
      .filter((leak) => leak.type === 'subscription' || leak.type === 'price_increase')
      .map((leak) => `Subscription: ${leak.merchant}`),
    ...finance.leaks.filter((leak) => leak.type === 'waste' || leak.type === 'duplicate').map((leak) => `Savings opportunity: ${leak.merchant}`),
  ];

  return Array.from(new Set(signals)).slice(0, 8);
}

export function buildMemoryTags(finance: FinanceAnalysis | null): string[] {
  const tags = new Set<string>();
  for (const signal of pickImportantSignals(finance)) {
    const firstWord = signal.split(':')[0]?.toLowerCase();
    if (firstWord) tags.add(firstWord);
  }
  return sanitizeStringArray(Array.from(tags));
}
