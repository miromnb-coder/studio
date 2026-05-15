import type { AurenMemoryItem } from '../core/types';

export function rankMemoryItems(items: AurenMemoryItem[]): AurenMemoryItem[] {
  return [...items].sort((a, b) => b.confidence - a.confidence);
}
