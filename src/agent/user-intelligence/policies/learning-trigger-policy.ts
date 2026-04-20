export type LearningTriggerSource =
  | 'conversation'
  | 'response_usage'
  | 'navigation'
  | 'gmail'
  | 'calendar'
  | 'finance'
  | 'notes'
  | 'manual';

export type LearningTriggerInput = {
  source: LearningTriggerSource;
  eventName: string;
  userId?: string | null;
  evidenceCount?: number | null;
  confidence?: number | null;
  hasMeaningfulData?: boolean | null;
  isError?: boolean | null;
  isStreaming?: boolean | null;
  metadata?: Record<string, unknown> | null;
};

export type LearningTriggerDecision = {
  shouldLearn: boolean;
  reason: string;
  priority: 'low' | 'medium' | 'high';
};

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function isExplicitNegativeEvent(eventName: string): boolean {
  return [
    'error',
    'failed',
    'cancelled',
    'dismissed',
    'ignored',
  ].some((token) => eventName.includes(token));
}

function isHighValueSource(source: LearningTriggerSource): boolean {
  return source === 'gmail' || source === 'calendar' || source === 'finance';
}

export function resolveLearningTriggerDecision(
  input: LearningTriggerInput,
): LearningTriggerDecision {
  const eventName = normalizeText(input.eventName);
  const evidenceCount =
    typeof input.evidenceCount === 'number' && Number.isFinite(input.evidenceCount)
      ? input.evidenceCount
      : 1;
  const confidence =
    typeof input.confidence === 'number' && Number.isFinite(input.confidence)
      ? input.confidence
      : 0.5;

  if (!normalizeText(input.userId)) {
    return {
      shouldLearn: false,
      reason: 'Missing user id.',
      priority: 'low',
    };
  }

  if (input.isStreaming) {
    return {
      shouldLearn: false,
      reason: 'Skip learning during streaming.',
      priority: 'low',
    };
  }

  if (input.isError || isExplicitNegativeEvent(eventName)) {
    return {
      shouldLearn: false,
      reason: 'Skip learning from failed or invalid events.',
      priority: 'low',
    };
  }

  if (input.hasMeaningfulData === false) {
    return {
      shouldLearn: false,
      reason: 'No meaningful data to learn from.',
      priority: 'low',
    };
  }

  if (input.source === 'manual') {
    return {
      shouldLearn: true,
      reason: 'Manual updates should always be applied.',
      priority: 'high',
    };
  }

  if (isHighValueSource(input.source)) {
    if (confidence >= 0.45 || evidenceCount >= 1) {
      return {
        shouldLearn: true,
        reason: 'High-value domain signal.',
        priority: confidence >= 0.72 ? 'high' : 'medium',
      };
    }
  }

  if (input.source === 'conversation') {
    const strongConversationSignals = [
      'message_sent',
      'response_preference_detected',
      'language_preference_detected',
      'style_preference_detected',
      'length_preference_detected',
    ];

    if (strongConversationSignals.includes(eventName)) {
      return {
        shouldLearn: true,
        reason: 'Conversation contains preference or intent signal.',
        priority: confidence >= 0.7 ? 'medium' : 'low',
      };
    }
  }

  if (input.source === 'response_usage') {
    const strongUsageSignals = [
      'clicked_source',
      'opened_show_more',
      'clicked_product',
      'accepted_recommendation',
      'continued_same_topic',
    ];

    if (strongUsageSignals.includes(eventName)) {
      return {
        shouldLearn: true,
        reason: 'User interaction indicates response preference.',
        priority: evidenceCount >= 2 ? 'medium' : 'low',
      };
    }
  }

  if (input.source === 'navigation') {
    const strongNavigationSignals = [
      'opened_same_flow_repeatedly',
      'revisited_conversation',
      'opened_history_item',
    ];

    if (strongNavigationSignals.includes(eventName) && evidenceCount >= 2) {
      return {
        shouldLearn: true,
        reason: 'Repeated navigation pattern detected.',
        priority: 'low',
      };
    }
  }

  if (input.source === 'notes') {
    if (eventName === 'note_created' || eventName === 'note_reused') {
      return {
        shouldLearn: true,
        reason: 'Notes activity contains reusable user pattern.',
        priority: 'low',
      };
    }
  }

  return {
    shouldLearn: false,
    reason: 'Threshold not met for learning update.',
    priority: 'low',
  };
}
