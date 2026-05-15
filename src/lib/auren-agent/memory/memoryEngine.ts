import type { AurenAgentInput, AurenIntentResult, AurenMemoryState } from '../core/types';
import { rankMemoryItems } from './memoryRanker';
import { searchMemory } from './memorySearch';
import { persistMemoryCandidate } from './memoryWrite';

export async function buildMemoryState(
  input: AurenAgentInput,
  intent: AurenIntentResult,
  enableMemoryWrite = false,
): Promise<AurenMemoryState> {
  const items = intent.needsMemory
    ? rankMemoryItems(
        await searchMemory({
          normalizedMessage: input.message.trim(),
          input,
        }),
      )
    : [];

  const savedItem = enableMemoryWrite ? await persistMemoryCandidate(input, intent) : null;

  return {
    used: items.length > 0,
    saved: Boolean(savedItem),
    items: savedItem ? [savedItem, ...items] : items,
  };
}
