'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarClock, ChevronRight, CircleCheckBig, Clock3, Mail, Sparkles } from 'lucide-react';
import { getConnectorRecord, type ConnectorId, type ConnectorRecord } from '@/app/lib/connectors-state';

const connectorOrder: ConnectorId[] = ['gmail', 'google-calendar', 'browser', 'google-drive', 'github', 'outlook'];

function getSummary(status: ConnectorRecord['state']) {
  if (status === 'connected') return 'Connected';
  if (status === 'connecting' || status === 'reconnecting') return 'Connecting';
  if (status === 'error') return 'Needs attention';
  return 'Not connected';
}

export default function OperatorPage() {
  const router = useRouter();
  const [services, setServices] = useState<ConnectorRecord[]>([]);

  useEffect(() => {
    setServices(connectorOrder.map((id) => getConnectorRecord(id)));
  }, []);

  const connectedCount = useMemo(
    () => services.filter((service) => service.state === 'connected').length,
    [services],
  );

  const calendarConnected = services.find((item) => item.id === 'google-calendar')?.state === 'connected';

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f8fb] text-[#2d3440]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#fbfcff_0%,#f4f6fb_36%,#edf1f8_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.96),transparent_28%),radial-gradient(circle_at_86%_16%,rgba(228,233,242,0.64),transparent_34%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[560px] flex-col">
        <header className="sticky top-0 z-30 border-b border-white/70 bg-[rgba(246,248,252,0.78)] px-5 pb-3 pt-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/chat')}
              aria-label="Go back"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/85 bg-[rgba(255,255,255,0.8)] text-[#3b434f] shadow-[0_8px_18px_rgba(15,23,42,0.045)]"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.9} />
            </button>

            <h1 className="text-[21px] font-medium tracking-[-0.04em] text-[#2d3440]">Operator Hub</h1>

            <div className="h-11 w-11" />
          </div>
        </header>

        <main className="flex flex-1 flex-col px-5 pb-12 pt-5">
          <section className="rounded-[32px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(247,249,254,0.8))] p-5 shadow-[0_22px_48px_rgba(15,23,42,0.055)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8d97a6]">Operator Hub</p>
            <h2 className="mt-2 text-[32px] font-medium tracking-[-0.06em] text-[#28303b]">Connected services</h2>
            <p className="mt-2 text-[14px] leading-6 text-[#7d8391]">
              Launch tools, connected services, and recent operator workflows.
            </p>

            <div className="mt-4 space-y-2">
              {services.slice(0, 4).map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => router.push('/chat')}
                  className="flex w-full items-center justify-between rounded-[18px] border border-white/90 bg-white/85 px-4 py-3 text-left shadow-[0_8px_16px_rgba(15,23,42,0.04)]"
                >
                  <span>
                    <span className="block text-[14px] font-semibold text-[#2d3440]">{service.name}</span>
                    <span className="text-[12px] text-[#7d8391]">{getSummary(service.state)}</span>
                  </span>
                  <span className={`inline-flex h-2.5 w-2.5 rounded-full ${service.state === 'connected' ? 'bg-[#6bb68a]' : 'bg-[#c4ccda]'}`} />
                </button>
              ))}
            </div>

            <p className="mt-4 inline-flex items-center gap-1 rounded-full border border-white/90 bg-white/80 px-3 py-1 text-[12px] text-[#667085]">
              <CircleCheckBig className="h-3.5 w-3.5" />
              {connectedCount} service{connectedCount === 1 ? '' : 's'} connected
            </p>
          </section>

          <section className="mt-4 rounded-[28px] border border-white/85 bg-white/80 p-4 shadow-[0_16px_32px_rgba(15,23,42,0.04)]">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a1]"><CalendarClock className="h-3.5 w-3.5" />Recommended next step</p>
            <p className="mt-2 text-[15px] text-[#2f3744]">
              {calendarConnected
                ? 'Calendar is connected. Run your free-time finder and lock today’s focus block.'
                : 'Connect Calendar to unlock planning tools.'}
            </p>
            <button
              type="button"
              onClick={() => router.push('/chat')}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1f242c] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Open connectors
              <ChevronRight className="h-4 w-4" />
            </button>
          </section>

          <section className="mt-4 rounded-[28px] border border-white/85 bg-white/80 p-4 shadow-[0_16px_32px_rgba(15,23,42,0.04)]">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a1]"><Sparkles className="h-3.5 w-3.5" />Recent workflows</p>
            <div className="mt-3 space-y-2">
              {[
                { label: 'Inbox summary completed', icon: Mail },
                { label: 'Subscription scan ready', icon: Clock3 },
                { label: 'Repo insights available', icon: Clock3 },
              ].map((workflow) => {
                const Icon = workflow.icon;
                return (
                  <button
                    key={workflow.label}
                    type="button"
                    onClick={() => router.push('/actions')}
                    className="flex w-full items-center justify-between rounded-[16px] border border-[#ebeff5] bg-[#fbfcff] px-3 py-3 text-left"
                  >
                    <span className="inline-flex items-center gap-2 text-[14px] text-[#374151]"><Icon className="h-4 w-4 text-[#8b93a1]" />{workflow.label}</span>
                    <ChevronRight className="h-4 w-4 text-[#9aa2af]" />
                  </button>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
