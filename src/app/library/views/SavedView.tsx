import { Bookmark } from 'lucide-react';
import type { LibraryData } from '../types';

export function SavedView({ data }: { data: LibraryData }) {
  return (
    <div className="space-y-3.5 pb-28">
      <section className="rounded-[22px] border border-black/[0.055] bg-white p-4">
        <p className="text-[24px] font-semibold tracking-[-0.04em]">Saved</p>
        <p className="mt-1 text-[13px] text-black/50">Prompts, memories, answers, notes, and bookmarks.</p>
      </section>

      <section className="space-y-2.5 rounded-[22px] border border-black/[0.055] bg-white p-3.5">
        {data.savedItems.length ? data.savedItems.map((item) => (
          <article key={item.id} className="flex items-start justify-between gap-3 rounded-[14px] border border-black/[0.05] px-3 py-2.5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/5"><Bookmark className="h-3.5 w-3.5" /></span>
              <div>
                <p className="text-[14px] font-semibold">{item.title}</p>
                <p className="text-[12px] text-black/50">{item.subtitle}</p>
              </div>
            </div>
            <span className="text-[11px] text-black/40">{item.savedAtLabel}</span>
          </article>
        )) : <p className="px-1 py-3 text-[13px] text-black/45">No saved items yet.</p>}
      </section>
    </div>
  );
}
