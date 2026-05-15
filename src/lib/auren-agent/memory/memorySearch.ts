import type { AurenContext, AurenMemoryItem } from '../core/types';

export async function searchMemory(_context: Pick<AurenContext, 'normalizedMessage' | 'input'>): Promise<AurenMemoryItem[]> {
  return [];
}
