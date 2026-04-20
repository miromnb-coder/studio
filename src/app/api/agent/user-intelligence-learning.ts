import {
  nowIso,
  type DomainSignal,
  type PreferenceSignal,
  type UserIntelligenceProfile,
} from '@/agent/user-intelligence/types';
import { resolveLearningTriggerDecision } from '@/agent/user-intelligence/policies/learning-trigger-policy';

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function inferResponseLengthLabel(text: string): string {
  const count = text.trim().split(/\s+/).filter(Boolean).length;
  if (count <= 80) return 'short';
  if (count <= 220) return 'medium';
  return 'long';
}

function clampConfidence(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function confidenceBand(value: number): 'low' | 'medium' | 'high' {
  if (value >= 0.8) return 'high';
  if (value >= 0.55) return 'medium';
  return 'low';
}

function upsertPreferenceSignal(
  signals: PreferenceSignal[],
  key: string,
  value: string,
  confidence: number,
  source: PreferenceSignal['source'],
  timestamp: string,
): PreferenceSignal[] {
  const existingIndex = signals.findIndex(
    (item) => item.value.key === key && item.value.value === value,
  );

  if (existingIndex === -1) {
    return [
      {
        value: { key, value },
        confidence: confidenceBand(confidence),
        source,
        firstSeenAt: timestamp,
        lastSeenAt: timestamp,
        evidenceCount: 1,
      },
      ...signals,
    ].slice(0, 12);
  }

  return signals.map((signal, index) => {
    if (index !== existingIndex) return signal;

    return {
      ...signal,
      confidence:
        signal.confidence === 'high' || confidenceBand(confidence) === 'high'
          ? 'high'
          : signal.confidence === 'medium' || confidenceBand(confidence) === 'medium'
            ? 'medium'
            : 'low',
      lastSeenAt: timestamp,
      evidenceCount: signal.evidenceCount + 1,
    };
  });
}

function upsertDomainSignal(
  signals: DomainSignal[],
  key: string,
  value: string,
  confidence: number,
  timestamp: string,
): DomainSignal[] {
  const existingIndex = signals.findIndex(
    (item) => item.value.key === key && item.value.value === value,
  );

  if (existingIndex === -1) {
    return [
      {
        value: { key, value },
        confidence: confidenceBand(confidence),
        source: 'conversation',
        firstSeenAt: timestamp,
        lastSeenAt: timestamp,
        evidenceCount: 1,
      },
      ...signals,
    ].slice(0, 12);
  }

  return signals.map((signal, index) => {
    if (index !== existingIndex) return signal;
    return {
      ...signal,
      confidence:
        signal.confidence === 'high' || confidenceBand(confidence) === 'high'
          ? 'high'
          : signal.confidence === 'medium' || confidenceBand(confidence) === 'medium'
            ? 'medium'
            : 'low',
      lastSeenAt: timestamp,
      evidenceCount: signal.evidenceCount + 1,
    };
  });
}

export type ApplyLearningParams = {
  profile: UserIntelligenceProfile;
  userId: string;
  userInput: string;
  reply: string;
  intent: string;
  responseLanguage?: string;
  responseMode?: string;
  isError?: boolean;
};

export function applyConversationLearningIfNeeded(
  params: ApplyLearningParams,
): { updatedProfile: UserIntelligenceProfile; shouldLearn: boolean; reason: string } {
  const responseLanguage = normalizeString(params.responseLanguage).toLowerCase();
  const intent = normalizeString(params.intent).toLowerCase();
  const reply = normalizeString(params.reply);
  const hasMeaningfulData = Boolean(reply || responseLanguage || intent);

  const confidence = clampConfidence(
    params.responseMode === 'operator' || params.responseMode === 'tool' ? 0.8 : 0.65,
  );

  const eventName = responseLanguage
    ? 'language_preference_detected'
    : reply
      ? 'response_preference_detected'
      : 'continued_same_topic';

  const decision = resolveLearningTriggerDecision({
    source: 'conversation',
    eventName,
    userId: params.userId,
    evidenceCount: hasMeaningfulData ? 2 : 0,
    confidence,
    hasMeaningfulData,
    isError: params.isError,
  });

  if (!decision.shouldLearn) {
    return {
      updatedProfile: params.profile,
      shouldLearn: false,
      reason: decision.reason,
    };
  }

  const timestamp = nowIso();
  const detectedLength = inferResponseLengthLabel(reply || params.userInput);
  let updatedProfile: UserIntelligenceProfile = {
    ...params.profile,
    updatedAt: timestamp,
    preferences: {
      ...params.profile.preferences,
      responseLength: upsertPreferenceSignal(
        params.profile.preferences.responseLength,
        'response_length',
        detectedLength,
        confidence,
        'conversation',
        timestamp,
      ),
      responseLanguage: responseLanguage
        ? upsertPreferenceSignal(
            params.profile.preferences.responseLanguage,
            'response_language',
            responseLanguage,
            confidence,
            'conversation',
            timestamp,
          )
        : params.profile.preferences.responseLanguage,
      responseStyle: params.profile.preferences.responseStyle,
    },
    usage: {
      ...params.profile.usage,
      topIntents: intent
        ? upsertDomainSignal(
            params.profile.usage.topIntents,
            'intent',
            intent,
            confidence,
            timestamp,
          )
        : params.profile.usage.topIntents,
    },
  };

  return {
    updatedProfile,
    shouldLearn: true,
    reason: decision.reason,
  };
}
