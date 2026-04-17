export type AnalyticsEventName =
  | 'chat_message_send'
  | 'chat_message_success'
  | 'chat_message_failure'
  | 'chat_retry'
  | 'chat_stream_first_token'
  | 'chat_stream_completed'
  | 'chat_stream_interrupted'
  | 'chat_phase_transition'
  | 'chat_paywall_hit'
  | 'chat_prompt_template_used'
  | 'chat_conversation_opened'
  | 'chat_conversation_reopened'
  | 'chat_abandoned_send'
  | 'operator_action_impression'
  | 'operator_action_clicked'
  | 'operator_action_card_ignored'
  | 'memory_used_in_response'
  | 'memory_resume_action_clicked'
  | 'memory_task_resumed_completed'
  | 'memory_problem_resolution_accelerated'
  | 'inbox_summary_opened'
  | 'urgent_emails_viewed'
  | 'subscriptions_found'
  | 'savings_action_clicked'
  | 'draft_generated'
  | 'digest_viewed';

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  ts: string;
  sessionId: string;
  conversationId?: string;
  messageId?: string;
  requestId?: string;
  properties?: Record<string, unknown>;
};

const MAX_PROPERTY_KEYS = 32;

export function sanitizeEvent(input: unknown): AnalyticsEvent | null {
  if (!input || typeof input !== 'object') return null;

  const event = input as Record<string, unknown>;
  const name = event.name;
  const ts = event.ts;
  const sessionId = event.sessionId;

  if (typeof name !== 'string' || typeof ts !== 'string' || typeof sessionId !== 'string') return null;

  const propertiesRecord =
    event.properties && typeof event.properties === 'object'
      ? Object.fromEntries(Object.entries(event.properties as Record<string, unknown>).slice(0, MAX_PROPERTY_KEYS))
      : undefined;

  return {
    name: name as AnalyticsEventName,
    ts,
    sessionId,
    conversationId: typeof event.conversationId === 'string' ? event.conversationId : undefined,
    messageId: typeof event.messageId === 'string' ? event.messageId : undefined,
    requestId: typeof event.requestId === 'string' ? event.requestId : undefined,
    properties: propertiesRecord,
  };
}

export function createAnalyticsSessionId(): string {
  return `kivo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
