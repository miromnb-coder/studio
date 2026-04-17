import { computeFreeTimeBlocks, type GoogleCalendarEvent } from '@/lib/integrations/google-calendar';
import type { FreeTimeIntelligenceResult } from './types';

function pickNextSlot(blocks: Array<{ startAt: string; endAt: string; durationMinutes: number }>, minMinutes: number) {
  const slot = blocks.find((block) => block.durationMinutes >= minMinutes);
  if (!slot) return null;
  return { startAt: slot.startAt, endAt: slot.endAt };
}

export function buildFreeTimeIntelligence(events: GoogleCalendarEvent[]): FreeTimeIntelligenceResult {
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 7);

  const freeBlocks = computeFreeTimeBlocks(events, now, horizon);
  const nextFree30 = pickNextSlot(freeBlocks, 30);
  const nextFree60 = pickNextSlot(freeBlocks, 60);

  const bestDeepWorkWindow = [...freeBlocks]
    .filter((block) => block.durationMinutes >= 90)
    .sort((a, b) => b.durationMinutes - a.durationMinutes)[0] || null;

  return {
    generatedAt: new Date().toISOString(),
    nextFree30Min: nextFree30,
    nextFree60Min: nextFree60,
    bestDeepWorkWindow: bestDeepWorkWindow
      ? {
          startAt: bestDeepWorkWindow.startAt,
          endAt: bestDeepWorkWindow.endAt,
          durationMinutes: bestDeepWorkWindow.durationMinutes,
        }
      : null,
  };
}
