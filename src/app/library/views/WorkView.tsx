import { ArrowRight, Circle } from 'lucide-react';
import type { LibraryData } from '../types';

export function WorkView({ data }: { data: LibraryData }) {
  const today = data.tasks.filter((task) => task.status === 'today').length;
  const progress = data.tasks.filter((task) => task.status === 'in_progress').length;
  const done = data.tasks.filter((task) => task.status === 'done').length;

  return (
    <div className="space-y-3.5 pb-28">
      <section className="rounded-[22px] border border-black/[0.055] bg-white p-4">
        <p className="text-[24px] font-semibold tracking-[-0.04em]">Work</p>
        <p className="mt-1 text-[13px] text-black/50">Stay on top of your tasks and projects.</p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-full bg-[#141414] px-2 py-1.5 text-[12px] font-semibold text-white">Today {today}</div>
          <div className="rounded-full bg-black/5 px-2 py-1.5 text-[12px] font-semibold text-black/60">In progress {progress}</div>
          <div className="rounded-full bg-black/5 px-2 py-1.5 text-[12px] font-semibold text-black/60">Done {done}</div>
        </div>
      </section>

      <section className="space-y-2.5 rounded-[22px] border border-black/[0.055] bg-white p-3.5">
        {data.tasks.map((task) => (
          <article key={task.id} className="flex items-center justify-between rounded-[14px] border border-black/[0.05] px-3 py-2.5">
            <div className="flex items-start gap-3">
              <Circle className="mt-0.5 h-4 w-4 text-black/50" />
              <div>
                <p className="text-[14px] font-medium">{task.title}</p>
                <p className="text-[12px] text-black/45">{task.subtitle}</p>
              </div>
            </div>
            <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-medium">{task.dueLabel}</span>
          </article>
        ))}
      </section>

      <button className="flex w-full items-center justify-between rounded-[20px] border border-black/[0.055] bg-white px-4 py-3.5 text-left">
        <div>
          <p className="text-[16px] font-semibold tracking-[-0.03em]">AI Priority</p>
          <p className="text-[13px] text-black/50">{today + progress} tasks need attention today.</p>
        </div>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
