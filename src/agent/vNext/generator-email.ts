import type { StructuredAnswer } from './types';
import type { StructuredPayloadSchema, ToolSummaryItem } from './generator-types';
import { asArray, asObject, normalizeText } from './generator-types';

export function buildEmailResponse(params: {
  structured: StructuredAnswer;
  toolSummaries: ToolSummaryItem[];
}): Partial<StructuredPayloadSchema> {
  const { structured, toolSummaries } = params;

  const emailItems: StructuredPayloadSchema['emailItems'] = [];
  const events: StructuredPayloadSchema['events'] = [];
  let urgentLabel: string | null = null;

  for (const item of toolSummaries) {
    if (!item.ok) continue;

    if (item.tool === 'gmail') {
      const data = asObject(item.data);
      const result = asObject(data.result);

      if (!urgentLabel) {
        urgentLabel = normalizeText(result.summary) || normalizeText(data.summary) || null;
      }

      const rawMessages =
        asArray(result.urgentMessages).length > 0
          ? asArray(result.urgentMessages)
          : asArray(result.messages).length > 0
            ? asArray(result.messages)
            : asArray(data.messages).length > 0
              ? asArray(data.messages)
              : asArray(data.emails);

      for (const raw of rawMessages) {
        const record = asObject(raw);
        const subject = normalizeText(record.subject || record.title || record.label);
        if (!subject) continue;

        const importanceRaw = normalizeText(record.importance || record.priority || record.tone).toLowerCase();
        const importance =
          importanceRaw === 'urgent' || importanceRaw === 'important'
            ? (importanceRaw as 'urgent' | 'important')
            : 'normal';

        emailItems.push({
          id: normalizeText(record.id) || `email-${emailItems.length}`,
          sender: normalizeText(record.sender || record.from) || null,
          subject,
          preview: normalizeText(record.preview || record.snippet || record.summary) || null,
          importance,
          href: normalizeText(record.href || record.url) || null,
        });
      }
    }

    if (item.tool === 'calendar') {
      const data = asObject(item.data);
      const result = asObject(data.result);
      const rawEvents = asArray(data.events).length > 0 ? asArray(data.events) : asArray(result.events);

      for (const raw of rawEvents) {
        const record = asObject(raw);
        const title = normalizeText(record.title || record.summary || record.label);
        if (!title) continue;
        events.push({
          id: normalizeText(record.id) || `event-${events.length}`,
          title,
          time: normalizeText(record.time || record.startAt || record.start) || null,
          subtitle: normalizeText(record.subtitle || record.location || record.description) || null,
        });
      }
    }
  }

  const actionSummary =
    structured.nextStep ||
    (emailItems.length || events.length
      ? 'Review urgent messages first, then confirm upcoming events.'
      : undefined);

  return {
    urgentLabel,
    emailItems: emailItems.slice(0, 8),
    events: events.slice(0, 10),
    summary: structured.summary || actionSummary,
    nextActions: actionSummary ? [actionSummary] : undefined,
  };
}
