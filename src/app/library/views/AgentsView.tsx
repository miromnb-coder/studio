import { Bot, CheckCircle2 } from 'lucide-react';
import type { LibraryData } from '../types';

export function AgentsView({ data }: { data: LibraryData }) {
  return (
    <div className="space-y-3.5 pb-28">
      <section className="rounded-[22px] border border-black/[0.055] bg-white p-4">
        <p className="text-[24px] font-semibold tracking-[-0.04em]">Your agents</p>
        <p className="mt-1 text-[13px] text-black/50">AI agents working for you.</p>
      </section>

      <div className="space-y-2.5">
        {data.agents.map((agent) => (
          <article key={agent.id} className="rounded-[18px] border border-black/[0.055] bg-white p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5"><Bot className="h-4 w-4" /></span>
                <div>
                  <p className="text-[15px] font-semibold">{agent.title}</p>
                  <p className="text-[12px] text-black/50">{agent.subtitle}</p>
                </div>
              </div>
              <span className={['h-5 w-9 rounded-full border p-0.5', agent.enabled ? 'border-black bg-black' : 'border-black/15 bg-black/10'].join(' ')}>
                <span className={['block h-4 w-4 rounded-full bg-white transition', agent.enabled ? 'translate-x-4' : 'translate-x-0'].join(' ')} />
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between pl-11 text-[12px] text-black/45">
              <span>{agent.status === 'active' ? 'Active' : 'Idle'}</span>
              <span>{agent.lastActivity}</span>
            </div>
          </article>
        ))}
      </div>

      <section className="flex items-center gap-3 rounded-[18px] border border-black/[0.055] bg-white px-4 py-3.5 text-[13px] text-black/60">
        <CheckCircle2 className="h-4 w-4" />
        <div>
          <p className="font-medium text-black/80">All agents are up to date</p>
          <p>Great, your automations are running smoothly.</p>
        </div>
      </section>
    </div>
  );
}
