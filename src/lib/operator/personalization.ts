import type { SupabaseClient } from '@supabase/supabase-js';

export type DecisionStyle = 'aggressive' | 'balanced' | 'conservative';
export type FocusLevel = 'low' | 'medium' | 'high';
export type VerbosityPreference = 'short' | 'medium' | 'detailed';

export type UserProfileIntelligence = {
  user_id: string;
  preferred_language: string;
  language_confidence: number;
  decision_style: DecisionStyle;
  savings_focus: FocusLevel;
  verbosity_preference: VerbosityPreference;
  risk_tolerance: FocusLevel;
  behavior_summary: string;
  last_updated: string;
};

export type PersonalizationSnapshot = {
  price_sensitivity: FocusLevel;
  preferred_tone: 'supportive' | 'direct' | 'analytical';
  completion_behavior: 'executor' | 'explorer' | 'needs_nudges';
  reminder_timing: 'morning' | 'afternoon' | 'evening';
  focus_categories: string[];
  profile_summary: string;
};

type ProfileIntelligenceRow = UserProfileIntelligence;

const LANGUAGE_KEYWORDS: Array<{ language: string; pattern: RegExp }> = [
  { language: 'fi', pattern: /\b(vastaa suomeksi|suomeksi|kiitos|miten|voinko|haluan)\b/i },
  { language: 'es', pattern: /\b(responde? en español|español|hola|gracias|cómo|puedes)\b/i },
  { language: 'fr', pattern: /\b(réponds? en français|français|bonjour|merci|comment|peux-tu)\b/i },
  { language: 'de', pattern: /\b(antworte auf deutsch|deutsch|hallo|danke|wie|kannst du)\b/i },
  { language: 'pt', pattern: /\b(responda em português|português|olá|obrigado|como|pode)\b/i },
  { language: 'it', pattern: /\b(rispondi in italiano|italiano|ciao|grazie|come|puoi)\b/i },
  { language: 'sv', pattern: /\b(svara på svenska|svenska|hej|tack|hur|kan du)\b/i },
  { language: 'ja', pattern: /[\u3040-\u30ff\u4e00-\u9faf]/ },
  { language: 'ko', pattern: /[\uac00-\ud7af]/ },
  { language: 'zh', pattern: /[\u3400-\u9fff]/ },
  { language: 'ar', pattern: /[\u0600-\u06ff]/ },
  { language: 'ru', pattern: /[\u0400-\u04ff]/ },
  { language: 'hi', pattern: /[\u0900-\u097f]/ },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toFocusLevel(score: number): FocusLevel {
  if (score >= 0.67) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

function inferLanguage(input: string): { language: string; confidence: number } {
  const lowered = input.toLowerCase();

  if (/\b(vastaa suomeksi|kirjoita suomeksi|vaihda kieli suomeksi)\b/i.test(lowered)) {
    return { language: 'fi', confidence: 0.97 };
  }
  if (/\b(vastaa englanniksi|kirjoita englanniksi|vaihda kieli englanniksi)\b/i.test(lowered)) {
    return { language: 'en', confidence: 0.97 };
  }

  const explicitMatch = lowered.match(/\b(reply|respond|answer|speak|write|vastaa|kirjoita)\s+(in\s+)?([a-z\-]{2,20})\b/i);
  if (explicitMatch?.[3]) {
    return { language: explicitMatch[3].slice(0, 8), confidence: 0.95 };
  }

  for (const option of LANGUAGE_KEYWORDS) {
    if (option.pattern.test(input)) return { language: option.language, confidence: 0.82 };
  }

  const hasLatinText = /[a-zåäö]/i.test(lowered);
  return { language: existingLanguageFallback(lowered, hasLatinText), confidence: hasLatinText ? 0.45 : 0.4 };
}

function existingLanguageFallback(input: string, hasLatinText: boolean): string {
  if (/\b(kiitos|mitä|mita|voinko|haluan|minä|mina)\b/i.test(input)) return 'fi';
  if (!hasLatinText) return 'en';
  return 'en';
}

function inferVerbosityPreference(input: string): VerbosityPreference {
  const text = input.toLowerCase();
  if (/\b(overwhelmed|stressed|simple|just steps|one step at a time)\b/.test(text)) return 'short';
  if (/\b(short|brief|concise|tldr|quick)\b/.test(text)) return 'short';
  if (/\b(detailed|deep|thorough|step-by-step|comprehensive)\b/.test(text)) return 'detailed';
  return 'medium';
}

function inferDecisionStyle(input: string): DecisionStyle {
  const text = input.toLowerCase();
  if (/\b(maximum|aggressive|optimi[sz]e hard|high growth|move fast|highest return)\b/.test(text)) return 'aggressive';
  if (/\b(safe|stable|minimi[sz]e risk|careful|conservative)\b/.test(text)) return 'conservative';
  if (/\b(overwhelmed|busy|no time|simple)\b/.test(text)) return 'balanced';
  return 'balanced';
}

function inferRiskTolerance(input: string): FocusLevel {
  const text = input.toLowerCase();
  const high = /\b(high risk|aggressive|speculative|i can tolerate volatility)\b/.test(text);
  const low = /\b(low risk|risk-averse|safe|capital preservation|don't want risk)\b/.test(text);
  if (high) return 'high';
  if (low) return 'low';
  return 'medium';
}

function inferSavingsFocus(input: string): FocusLevel {
  const text = input.toLowerCase();
  const score = [
    /\b(save money|cut costs|reduce spend|lower bill|cancel subscription)\b/.test(text) ? 0.5 : 0,
    /\b(biggest savings|as much as possible|optimi[sz]e spending)\b/.test(text) ? 0.3 : 0,
    /\b(need more money monthly|more money left each month|paycheck to paycheck)\b/.test(text) ? 0.35 : 0,
    /\b(just curious|general question|not about savings)\b/.test(text) ? -0.3 : 0,
  ].reduce((sum, value) => sum + value, 0.3);

  return toFocusLevel(clamp(score, 0, 1));
}

function nextConfidence(previous: number, current: number): number {
  if (!previous) return current;
  const smoothed = previous * 0.7 + current * 0.3;
  return Math.round(clamp(smoothed, 0.35, 0.98) * 100) / 100;
}

export function buildBehaviorSummary(profile: Omit<UserProfileIntelligence, 'behavior_summary' | 'last_updated' | 'user_id'>): string {
  return [
    `Language: ${profile.preferred_language} (${Math.round(profile.language_confidence * 100)}% confidence)`,
    `Decision style: ${profile.decision_style}`,
    `Savings focus: ${profile.savings_focus}`,
    `Verbosity: ${profile.verbosity_preference}`,
    `Risk tolerance: ${profile.risk_tolerance}`,
  ].join(' | ');
}

export function buildPersonalizationSnapshot(params: {
  profile: UserProfileIntelligence | null;
  outcomes: Array<Record<string, unknown>>;
  financeProfile: Record<string, unknown> | null;
}): PersonalizationSnapshot {
  const profile = params.profile;
  const outcomes = Array.isArray(params.outcomes) ? params.outcomes : [];
  const completed = outcomes.filter((item) => String(item.status || '') === 'completed').length;
  const postponed = outcomes.filter((item) => String(item.status || '') === 'postponed').length;
  const ignored = outcomes.filter((item) => String(item.status || '') === 'ignored').length;
  const total = Math.max(1, outcomes.length);

  const completionRate = completed / total;
  const deferralRate = postponed / total;

  const monthlyTotal = typeof params.financeProfile?.total_monthly_cost === 'number' ? params.financeProfile.total_monthly_cost : 0;
  const estimatedSavings = typeof params.financeProfile?.estimated_savings === 'number' ? params.financeProfile.estimated_savings : 0;
  const savingsRatio = monthlyTotal > 0 ? estimatedSavings / monthlyTotal : 0;

  const activeSubscriptions = Array.isArray(params.financeProfile?.active_subscriptions)
    ? params.financeProfile.active_subscriptions
    : [];
  const categories = activeSubscriptions
    .map((item) => String((item as Record<string, unknown>).category || '').trim().toLowerCase())
    .filter(Boolean);
  const uniqueCategories = [...new Set(categories)].slice(0, 4);

  const priceSensitivity: FocusLevel = savingsRatio >= 0.35 ? 'high' : savingsRatio >= 0.16 ? 'medium' : 'low';
  const preferredTone: PersonalizationSnapshot['preferred_tone'] =
    profile?.verbosity_preference === 'detailed' ? 'analytical' : profile?.decision_style === 'aggressive' ? 'direct' : 'supportive';
  const completionBehavior: PersonalizationSnapshot['completion_behavior'] =
    completionRate >= 0.45 ? 'executor' : deferralRate >= 0.28 || ignored >= completed ? 'needs_nudges' : 'explorer';
  const reminderTiming: PersonalizationSnapshot['reminder_timing'] =
    completionBehavior === 'executor' ? 'morning' : completionBehavior === 'explorer' ? 'afternoon' : 'evening';

  const summary = [
    `Price sensitivity: ${priceSensitivity}`,
    `Tone: ${preferredTone}`,
    `Action style: ${completionBehavior}`,
    `Best reminder window: ${reminderTiming}`,
    uniqueCategories.length ? `Top categories: ${uniqueCategories.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  return {
    price_sensitivity: priceSensitivity,
    preferred_tone: preferredTone,
    completion_behavior: completionBehavior,
    reminder_timing: reminderTiming,
    focus_categories: uniqueCategories,
    profile_summary: summary,
  };
}

export async function getUserProfileIntelligence(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserProfileIntelligence | null> {
  const result = await supabase
    .from('user_profile_intelligence')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (result.error) throw result.error;
  return (result.data || null) as ProfileIntelligenceRow | null;
}

export async function updateUserProfileIntelligence(params: {
  supabase: SupabaseClient;
  userId: string;
  userMessage: string;
  existing: UserProfileIntelligence | null;
}): Promise<UserProfileIntelligence> {
  const { supabase, userId, userMessage, existing } = params;
  const language = inferLanguage(userMessage);

  const merged = {
    user_id: userId,
    preferred_language: language.confidence >= 0.75 ? language.language : existing?.preferred_language || language.language,
    language_confidence: nextConfidence(existing?.language_confidence || 0, language.confidence),
    decision_style: inferDecisionStyle(userMessage) || existing?.decision_style || 'balanced',
    savings_focus: inferSavingsFocus(userMessage) || existing?.savings_focus || 'medium',
    verbosity_preference: inferVerbosityPreference(userMessage) || existing?.verbosity_preference || 'medium',
    risk_tolerance: inferRiskTolerance(userMessage) || existing?.risk_tolerance || 'medium',
  } as const;

  const payload: UserProfileIntelligence = {
    ...merged,
    behavior_summary: buildBehaviorSummary(merged),
    last_updated: new Date().toISOString(),
  };

  const upsertRes = await supabase.from('user_profile_intelligence').upsert(payload, { onConflict: 'user_id' }).select('*').single();
  if (upsertRes.error) throw upsertRes.error;

  return upsertRes.data as UserProfileIntelligence;
}
