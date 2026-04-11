import type { SupabaseClient } from '@supabase/supabase-js';

export type RecommendationOutcomeStatus = 'accepted' | 'ignored' | 'postponed' | 'completed';

export type RecommendationOutcomeRecord = {
  id: string;
  user_id: string;
  recommendation_id: string;
  recommended_action: string;
  status: RecommendationOutcomeStatus;
  estimated_monthly_impact: number | null;
  realized_impact: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchRecentRecommendationOutcomes(supabase: SupabaseClient, userId: string) {
  const result = await supabase
    .from('recommendation_outcomes')
    .select('id,user_id,recommendation_id,recommended_action,status,estimated_monthly_impact,realized_impact,completed_at,created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(60);

  if (result.error) {
    console.error('OPERATOR_OUTCOME_ERROR', { action: 'fetch_recent', userId, error: result.error.message });
    return [] as RecommendationOutcomeRecord[];
  }

  return (result.data || []) as RecommendationOutcomeRecord[];
}

export function shouldSuppressRecommendation(params: {
  recommendationId: string;
  outcomes: RecommendationOutcomeRecord[];
  nowIso?: string;
}) {
  const nowMs = new Date(params.nowIso || new Date().toISOString()).getTime();
  const latest = params.outcomes.find((item) => item.recommendation_id === params.recommendationId);
  if (!latest) return false;
  if (latest.status === 'accepted' || latest.status === 'completed' || latest.status === 'ignored') return true;
  if (latest.status === 'postponed') {
    const updated = new Date(latest.updated_at).getTime();
    if (!Number.isFinite(updated)) return false;
    const days = (nowMs - updated) / (1000 * 60 * 60 * 24);
    return days <= 14;
  }
  return false;
}
