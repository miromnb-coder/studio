import { CalendarCheck2, CheckCircle2, Sparkles, Wand2 } from 'lucide-react';
import type { LibraryData } from '../types';

export function TodayView({ data }: { data: LibraryData }) {
  const tasksToday = data.tasks.filter((task) => task.status !== 'done').length;
  const eventsToday = data.events.length;

  return (
    <div className="space-y-3.5 pb-28">
      <section className="rounded-[22px] border border-black/[0.055] bg-white px-4 py-4 shadow-[0_14px_30px_rgba(15,23,42,0.035)]">
        <p className="text-[24px] font-semibold tracking-[-0.04em] text-[#191b1f]">{data.greeting}</p>
        <p className="mt-1 text-[13px] text-black/50">Here&apos;s what matters most today.</p>
      </section>

      <section className="rounded-[22px] border border-black/[0.055] bg-white p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-[17px] font-semibold tracking-[-0.03em]">Today&apos;s focus</p>
            <p className="text-[13px] text-black/50">{tasksToday} tasks • {eventsToday} events</p>
          </div>
          <div className="rounded-full border border-black/10 px-3 py-1 text-[12px] font-medium">{data.focusProgress}%</div>
        </div>

        <div className="space-y-2.5">
          {data.tasks.slice(0, 3).map((task) => (
            <article key={task.id} className="flex items-center justify-between rounded-[14px] border border-black/[0.05] px-3 py-2.5">
              <div>
                <p className="text-[14px] font-medium">{task.title}</p>
                <p className="text-[12px] text-black/45">{task.subtitle}</p>
              </div>
              <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-medium">{task.dueLabel}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] border border-black/[0.055] bg-white p-4">
        <div className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.03em]"><Sparkles className="h-4 w-4" />AI suggestion</div>
        <p className="mt-2 text-[14px] text-black/60">{data.aiSuggestion}</p>
      </section>

      <section className="rounded-[22px] border border-black/[0.055] bg-white p-4">
        <p className="text-[16px] font-semibold tracking-[-0.03em]">Upcoming</p>
        <div className="mt-3 space-y-2.5">
          {data.events.length ? data.events.map((event) => (
            <div key={event.id} className="flex items-center gap-3 rounded-[14px] border border-black/[0.05] px-3 py-2.5">
              <CalendarCheck2 className="h-4 w-4 text-black/60" />
              <div>
                <p className="text-[14px] font-medium">{event.title}</p>
                <p className="text-[12px] text-black/45">{event.whenLabel} • {event.startLabel}</p>
              </div>
            </div>
          )) : <p className="text-[13px] text-black/45">No upcoming events yet.</p>}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5">
        <button className="flex items-center justify-center gap-2 rounded-[16px] border border-black/[0.06] bg-white px-3 py-3 text-[13px] font-medium"><Wand2 className="h-4 w-4" />Plan my day</button>
        <button className="flex items-center justify-center gap-2 rounded-[16px] border border-black/[0.06] bg-white px-3 py-3 text-[13px] font-medium"><CheckCircle2 className="h-4 w-4" />Quick review</button>
      </section>
    </div>
  );
}
