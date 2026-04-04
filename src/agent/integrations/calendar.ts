import { CalendarToolInput, CalendarToolOutput, ToolEnvelope } from '@/agent/v4/types';
import { mapToolError } from './common';

export async function runCalendarTool(input: CalendarToolInput): Promise<ToolEnvelope<CalendarToolOutput>> {
  try {
    const instruction = input.instruction?.trim();
    if (!instruction) {
      throw new Error('validation: calendar instruction is required');
    }

    const firstSentence = instruction.split(/[.!?]/).find(Boolean)?.trim() || 'Calendar action';
    const summary = `Prepared a calendar plan in ${input.timezone || 'local timezone'}.`;

    return {
      ok: true,
      data: {
        summary,
        proposedEvents: [
          {
            title: firstSentence,
            start: input.dateContext,
            notes: 'Generated from user request.',
          },
        ],
      },
      error: null,
    };
  } catch (error) {
    return { ok: false, data: null, error: mapToolError(error, 'Calendar tool failed.') };
  }
}
