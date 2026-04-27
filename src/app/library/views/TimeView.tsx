import { ArrowRight } from 'lucide-react';
import type { LibraryData } from '../types';

export function TimeView({ data }: { data: LibraryData }) {
  const nextEvent = data.events[0];

  return (
    <div className="space-y-3.5 pb-28">
      <section className="rounded-[22px] border border-black/[0.055] bg-white p-4">
        <p className="text-[24px] font-semibold tracking-[-0.04em]">Today</p>
        <p className="text-[13px] text-black/50">Your time blocks and schedule.</p>
      </section>

      <section className="rounded-[22px] border border-black/[0.055] bg-white p-4">
        <div className="space-y-3">
          {data.timeline.map((slot) => (
            <div key={slot.id} className="grid grid-cols-[42px_1fr] gap-2.5">
              <p className="pt-2 text-[12px] font-medium text-black/45">{slot.label}</p>
              <div className="rounded-[14px] border border-black/[0.05] px-3 py-2.5">
                <p className="text-[14px] font-medium">{slot.title}</p>
                <p className="text-[12px] text-black/45">{slot.timeRange}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[20px] border border-black/[0.055] bg-white p-4">
        <p className="text-[15px] font-semibold">Next event</p>
        <p className="mt-1 text-[13px] text-black/50">{nextEvent ? `${nextEvent.title} • ${nextEvent.startLabel}` : 'No upcoming event synced yet.'}</p>
        <p className="mt-2 text-[13px] text-black/50">Free slot: {data.events[1] ? `${data.events[1].startLabel} block available` : 'Use AI to find the best deep-work window.'}</p>
      </section>

      <button className="flex w-full items-center justify-between rounded-[20px] border border-black/[0.055] bg-white px-4 py-3.5">
        <div className="text-left">
          <p className="text-[16px] font-semibold tracking-[-0.03em]">Optimize my day</p>
          <p className="text-[13px] text-black/50">Let Kivo find the best time for your tasks.</p>
        </div>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
