import { NotesToolInput, NotesToolOutput, ToolEnvelope } from '@/agent/v4/types';
import { mapToolError } from './common';

export async function runNotesTool(input: NotesToolInput): Promise<ToolEnvelope<NotesToolOutput>> {
  try {
    const instruction = input.instruction?.trim();
    if (!instruction) {
      throw new Error('validation: notes instruction is required');
    }

    const bullets = instruction
      .split(/\n|\./)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 8);

    return {
      ok: true,
      data: {
        summary: 'Captured structured notes.',
        note: {
          title: bullets[0] || 'Quick Note',
          bullets,
        },
      },
      error: null,
    };
  } catch (error) {
    return { ok: false, data: null, error: mapToolError(error, 'Notes tool failed.') };
  }
}
