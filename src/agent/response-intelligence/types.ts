export type ResponseIntent =
  | 'plain'
  | 'search'
  | 'shopping'
  | 'compare'
  | 'email'
  | 'calendar'
  | 'operator';

export type ResponseLanguage = 'fi' | 'en' | 'sv' | 'auto';

export type ResponseStyle =
  | 'concise'
  | 'source_first'
  | 'recommendation_first'
  | 'comparison_first'
  | 'operator'
  | 'casual';

export type ResponseLength = 'short' | 'medium' | 'deep';

export type ResponsePriority =
  | 'summary_first'
  | 'top_result_first'
  | 'top_pick_first'
  | 'decision_first'
  | 'action_first';

export type ResponseVisibility = {
  initialItems: number;
  allowExpand: boolean;
  showTopCard: boolean;
  collapseSecondaryContent: boolean;
};

export type ResponsePolicy = {
  language: ResponseLanguage;
  style: ResponseStyle;
  length: ResponseLength;
  priority: ResponsePriority;
  visibility: ResponseVisibility;
  suppressRawToolText: boolean;
  suppressDebugText: boolean;
  preferStructuredView: boolean;
};

export type ResolveResponsePolicyInput = {
  intent: ResponseIntent;
  userMessage: string;
  detectedLanguage?: string | null;
  explicitLanguage?: string | null;
  responseMode?: string | null;
  hasStructuredResults?: boolean;
  confidence?: number | null;
};

export type UserResponsePreferences = {
  preferredLanguage?: string | null;
  preferredLength?: ResponseLength | null;
  preferSources?: boolean | null;
  preferCards?: boolean | null;
};
