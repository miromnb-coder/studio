export type IntelligenceConfidence = 'low' | 'medium' | 'high';

export type IntelligenceSource =
  | 'gmail'
  | 'calendar'
  | 'finance'
  | 'notes'
  | 'conversation'
  | 'navigation'
  | 'response_usage'
  | 'manual';

export type TimestampedSignal<T> = {
  value: T;
  confidence: IntelligenceConfidence;
  source: IntelligenceSource;
  firstSeenAt: string;
  lastSeenAt: string;
  evidenceCount: number;
};

export type ImportantPersonSignal = TimestampedSignal<{
  nameOrEmail: string;
  reason: string;
}>;

export type TimeWindowSignal = TimestampedSignal<{
  label: string;
  day?: string | null;
  startHour?: number | null;
  endHour?: number | null;
}>;

export type PreferenceSignal = TimestampedSignal<{
  key: string;
  value: string;
}>;

export type BehaviorSignal = TimestampedSignal<{
  pattern: string;
  explanation: string;
}>;

export type TopicSignal = TimestampedSignal<{
  topic: string;
}>;

export type WorkflowSignal = TimestampedSignal<{
  flow: string;
}>;

export type DomainSignal = TimestampedSignal<{
  key: string;
  value: string;
}>;

export type UserCommunicationIntelligence = {
  importantPeople: ImportantPersonSignal[];
  fastReplyWindows: TimeWindowSignal[];
  delayedReplyPatterns: BehaviorSignal[];
  frequentTopics: TopicSignal[];
};

export type UserScheduleIntelligence = {
  overloadedDays: TimeWindowSignal[];
  likelyFocusWindows: TimeWindowSignal[];
  recurringMeetingBlocks: TimeWindowSignal[];
  preferredPlanningWindows: TimeWindowSignal[];
};

export type UserFinanceIntelligence = {
  recurringVendors: DomainSignal[];
  subscriptionPatterns: BehaviorSignal[];
  spendingAlerts: BehaviorSignal[];
};

export type UserWorkstyleIntelligence = {
  procrastinationSignals: BehaviorSignal[];
  executionStrengths: BehaviorSignal[];
  planningWeaknesses: BehaviorSignal[];
};

export type UserPreferenceIntelligence = {
  responseLanguage: PreferenceSignal[];
  responseLength: PreferenceSignal[];
  responseStyle: PreferenceSignal[];
};

export type UserUsageIntelligence = {
  topIntents: DomainSignal[];
  activeHours: TimeWindowSignal[];
  preferredFlows: WorkflowSignal[];
};

export type UserDecisionIntelligence = {
  priceSensitivity: PreferenceSignal[];
  detailPreference: PreferenceSignal[];
};

export type UserIntelligenceProfile = {
  userId: string;
  version: number;
  updatedAt: string;

  communication: UserCommunicationIntelligence;
  schedule: UserScheduleIntelligence;
  finance: UserFinanceIntelligence;
  workstyle: UserWorkstyleIntelligence;
  preferences: UserPreferenceIntelligence;
  usage: UserUsageIntelligence;
  decisions: UserDecisionIntelligence;
};

export type PersistedUserIntelligenceRow = {
  user_id: string;
  profile_json: UserIntelligenceProfile;
  version: number;
  updated_at: string;
};

export const USER_INTELLIGENCE_VERSION = 1;

export function nowIso(): string {
  return new Date().toISOString();
}

export function createEmptyUserIntelligenceProfile(
  userId: string,
  now: string = nowIso(),
): UserIntelligenceProfile {
  return {
    userId,
    version: USER_INTELLIGENCE_VERSION,
    updatedAt: now,

    communication: {
      importantPeople: [],
      fastReplyWindows: [],
      delayedReplyPatterns: [],
      frequentTopics: [],
    },

    schedule: {
      overloadedDays: [],
      likelyFocusWindows: [],
      recurringMeetingBlocks: [],
      preferredPlanningWindows: [],
    },

    finance: {
      recurringVendors: [],
      subscriptionPatterns: [],
      spendingAlerts: [],
    },

    workstyle: {
      procrastinationSignals: [],
      executionStrengths: [],
      planningWeaknesses: [],
    },

    preferences: {
      responseLanguage: [],
      responseLength: [],
      responseStyle: [],
    },

    usage: {
      topIntents: [],
      activeHours: [],
      preferredFlows: [],
    },

    decisions: {
      priceSensitivity: [],
      detailPreference: [],
    },
  };
}

export function isUserIntelligenceProfile(
  value: unknown,
): value is UserIntelligenceProfile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const record = value as Record<string, unknown>;

  return (
    typeof record.userId === 'string' &&
    typeof record.version === 'number' &&
    typeof record.updatedAt === 'string' &&
    typeof record.communication === 'object' &&
    typeof record.schedule === 'object' &&
    typeof record.finance === 'object' &&
    typeof record.workstyle === 'object' &&
    typeof record.preferences === 'object' &&
    typeof record.usage === 'object' &&
    typeof record.decisions === 'object'
  );
}

export function normalizeUserIntelligenceProfile(
  value: unknown,
  userId: string,
): UserIntelligenceProfile {
  if (!isUserIntelligenceProfile(value)) {
    return createEmptyUserIntelligenceProfile(userId);
  }

  return {
    ...createEmptyUserIntelligenceProfile(userId),
    ...value,
    userId,
    version:
      typeof value.version === 'number'
        ? value.version
        : USER_INTELLIGENCE_VERSION,
    updatedAt:
      typeof value.updatedAt === 'string' && value.updatedAt.trim().length > 0
        ? value.updatedAt
        : nowIso(),
  };
}
