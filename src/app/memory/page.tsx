'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pencil, Search, Trash2 } from 'lucide-react';
import { AppShell, PremiumCard, ProductPageHeader, SectionHeader } from '../components/premium-ui';
import { EmptyIllustration } from '../components/product-sections';

const CATEGORIES = [
  'all',
  'profile',
  'goals',
  'projects',
  'preferences',
  'decisions',
  'routines',
  'blockers',
  'opportunities',
  'unfinished_items',
] as const;

type Category = (typeof CATEGORIES)[number];

type MemoryItem = {
  id: string;
  content: string;
  type: string;
  importance: number;
  createdAt: string;
  updatedAt?: string;
};

export default function MemoryPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const loadMemory = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category !== 'all') params.set('category', category);

    const response = await fetch(`/api/memory?${params.toString()}`);
    const payload = await response.json().catch(() => ({ items: [] }));
    setItems(Array.isArray(payload.items) ? payload.items : []);
    setLoading(false);
  };

  useEffect(() => {
    void loadMemory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter((item) => `${item.content} ${item.type}`.toLowerCase().includes(q));
  }, [items, query]);

  const deleteMemory = async (id: string) => {
    await fetch(`/api/memory/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const saveEdit = async () => {
    if (!editingId || draft.trim().length < 8) return;
    const response = await fetch(`/api/memory/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: draft.trim() }),
    });
    const payload = await response.json().catch(() => null);
    if (payload?.item) {
      setItems((prev) => prev.map((item) => (item.id === editingId ? payload.item : item)));
    }
    setEditingId(null);
    setDraft('');
  };

  const clearCategory = async () => {
    const suffix = category === 'all' ? '' : `?category=${category}`;
    await fetch(`/api/memory${suffix}`, { method: 'DELETE' });
    if (category === 'all') {
      setItems([]);
    } else {
      setItems((prev) => prev.filter((item) => item.type !== category));
    }
  };

  return (
    <AppShell>
      <ProductPageHeader pageTitle="Memory" pageSubtitle="Useful long-term context, not random trivia" />
      <div className="space-y-3 pb-20">
        <PremiumCard className="space-y-3 p-4">
          <SectionHeader title="Search memory" subtitle="Goals, projects, routines, decisions, and unfinished work" />
          <label className="flex items-center gap-2 rounded-[14px] border border-[#e4e7ed] bg-[#fafbfc] px-3 py-2.5">
            <Search className="h-4 w-4 text-[#7a818d]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => void loadMemory()}
              placeholder="Search memory"
              className="w-full bg-transparent text-sm text-[#111111] outline-none placeholder:text-[#9299a4]"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full border px-3 py-1.5 text-xs capitalize ${category === item ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#d9dde4] bg-white text-[#111111]'}`}
              >
                {item.replace('_', ' ')}
              </button>
            ))}
          </div>
          <button type="button" onClick={clearCategory} className="text-left text-xs font-medium text-[#9f1f1f]">
            Clear {category === 'all' ? 'all memory' : `${category.replace('_', ' ')} memory`}
          </button>
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Memory entries" subtitle="Edit or delete what Kivo keeps" />
          {loading ? (
            <p className="text-xs text-[#636a76]">Loading memory…</p>
          ) : filtered.length === 0 ? (
            <EmptyIllustration title="No memory found" message="No memory items match this filter." />
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="rounded-[16px] border border-[#e7eaf0] bg-[#fcfcfd] p-3">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-[#737a85]">{item.type.replace('_', ' ')}</p>
                {editingId === item.id ? (
                  <div className="space-y-2">
                    <textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full rounded-xl border border-[#dde1e8] bg-white p-2 text-sm outline-none" rows={3} />
                    <div className="flex gap-2 text-xs">
                      <button type="button" className="rounded-full bg-[#111111] px-3 py-1.5 text-white" onClick={saveEdit}>Save</button>
                      <button type="button" className="rounded-full border border-[#ccd2dc] px-3 py-1.5" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-[#111111]">{item.content}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-[#66707c]">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setDraft(item.content);
                        }}
                        className="inline-flex items-center gap-1"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button type="button" onClick={() => void deleteMemory(item.id)} className="inline-flex items-center gap-1 text-[#9f1f1f]">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </PremiumCard>
      </div>
    </AppShell>
  );
}
