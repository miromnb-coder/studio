import type { AgentContext, AgentMemoryContext, AgentMemoryItem, AgentRequest } from './types';

export async function fetchMemory(request: AgentRequest, _context: AgentContext): Promise<AgentMemoryItem[]> {
  // TODO: Integrate with existing app memory/history stores and vector retrieval.
  return [
    {
      id: `mem-${request.requestId}`,
      userId: request.userId,
      kind: 'summary',
      content: 'Memory integration scaffold initialized. No persisted memory source connected yet.',
      relevanceScore: 0.5,
      createdAt: new Date().toISOString(),
      tags: ['scaffold'],
    },
  ];
}

export function rankMemory(items: AgentMemoryItem[], query: string): AgentMemoryItem[] {
  const q = query.toLowerCase();

  return [...items].sort((a, b) => {
    const aBoost = a.content.toLowerCase().includes(q) ? 0.2 : 0;
    const bBoost = b.content.toLowerCase().includes(q) ? 0.2 : 0;

    return b.relevanceScore + bBoost - (a.relevanceScore + aBoost);
  });
}

export function buildMemoryContext(items: AgentMemoryItem[]): AgentMemoryContext {
  const summary = items.length
    ? items
        .slice(0, 3)
        .map((item) => item.content)
        .join(' ')
    : 'No memory retrieved.';

  return {
    items,
    summary,
    source: items.length ? 'local' : 'none',
  };
}

export async function maybeStoreMemory(_request: AgentRequest, _answer: string): Promise<void> {
  // TODO: Add policy-based memory write decisions and redaction filters.
}
