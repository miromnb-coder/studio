'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Database, Download, Lock, ShieldCheck, Trash2 } from 'lucide-react';

import KivoChatHeader from '@/components/chat/kivo/KivoChatHeader';
import { KivoChatSidebarArea, KIVO_CHAT_SIDEBAR_RAIL_WIDTH } from '@/components/chat/kivo/KivoChatSidebarArea';

const SIDEBAR_GAP = 12;

export default function PrivacyPage() {
  const router = useRouter();

  const [showSidebarRail, setShowSidebarRail] = useState(false);
  const [personalization, setPersonalization] = useState(false);
  const [memory, setMemory] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [connectedData, setConnectedData] = useState(false);
  const [hideSensitive, setHideSensitive] = useState(false);
  const [confirmActions, setConfirmActions] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  const contentLeftOffset = showSidebarRail ? KIVO_CHAT_SIDEBAR_RAIL_WIDTH + SIDEBAR_GAP : 0;

  useEffect(() => {
    setPersonalization(localStorage.getItem('kivo.privacy.personalization') === 'true');
    setMemory(localStorage.getItem('kivo.privacy.memory') === 'true');
    setAnalytics(localStorage.getItem('kivo.privacy.analytics') === 'true');
    setConnectedData(localStorage.getItem('kivo.privacy.connectedData') === 'true');
    setHideSensitive(localStorage.getItem('kivo.privacy.hideSensitive') === 'true');
    const storedConfirm = localStorage.getItem('kivo.privacy.confirmActions');
    setConfirmActions(storedConfirm === null ? true : storedConfirm === 'true');
  }, []);

  function saveToggle(key: string, value: boolean) {
    localStorage.setItem(key, String(value));
  }

  function exportPrivacyData() {
    const payload = {
      privacy: {
        personalization,
        memory,
        analytics,
        connectedData,
        hideSensitive,
        confirmActions,
      },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kivo-privacy-export.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function clearHistory() {
    localStorage.removeItem('kivo.history');
    localStorage.removeItem('kivo:history');
    localStorage.removeItem('kivo.activity');
    setConfirmClear(false);
  }

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#F8F8F7] text-[#111318]">
      {showSidebarRail ? (
        <KivoChatSidebarArea
          hasMessages={false}
          userName="Miro"
          plan="free"
          recentChats={[]}
          onNewChat={() => router.push('/chat')}
          onSearch={() => router.push('/search')}
          onOpenAgents={() => router.push('/agents')}
          onOpenTools={() => router.push('/tools')}
          onOpenAlerts={() => router.push('/alerts')}
          onOpenSettings={() => router.push('/settings')}
          onQuickTask={() => router.push('/chat')}
          onAnalyzeFile={() => router.push('/analyze')}
          onPlanMyDay={() => router.push('/actions?type=planner')}
          onOpenGmail={() => router.push('/actions?tool=gmail')}
          onOpenCalendar={() => router.push('/actions?tool=google-calendar')}
          onOpenDrive={() => router.push('/tools?source=drive')}
          onOpenWeb={() => router.push('/tools?tool=browser-search')}
          onUpgrade={() => router.push('/upgrade')}
        />
      ) : null}

      <div className="min-h-[100dvh] transition-[padding-left] duration-300 ease-out" style={{ paddingLeft: contentLeftOffset }}>
        <div className="sticky top-0 z-40 border-b border-black/[0.035] bg-white/82 backdrop-blur-2xl">
          <KivoChatHeader hasMessages={false} isSidebarOpen={showSidebarRail} onSidebarToggle={() => setShowSidebarRail((open) => !open)} />
        </div>
        <section className="px-4 pb-28 pt-7 sm:px-5">
          <div className="mx-auto max-w-[980px]">
            <button onClick={() => router.push('/settings')} className="mb-6 inline-flex items-center gap-2 rounded-[14px] border border-black/[0.055] bg-white px-4 py-2.5 text-[13px] font-medium shadow-[0_8px_22px_rgba(15,23,42,0.025)]"><ChevronLeft className="h-4 w-4" />Back to Settings</button>
            <div className="mb-7"><h1 className="font-serif text-[44px] leading-none tracking-[-0.06em]">Privacy</h1><p className="mt-2 text-[16px] text-black/50">Control your data, visibility, and personalization.</p></div>

            <Card>
              <SectionHeader title="Privacy status" subtitle="Current privacy posture for your account on this device." />
              <div className="grid gap-3 sm:grid-cols-3">
                <StatusPill label="Data" value="Private" />
                <StatusPill label="Personalization" value={personalization ? 'On' : 'Off'} />
                <StatusPill label="Memory" value={memory ? 'On' : 'Off'} />
              </div>
            </Card>

            <Card>
              <SectionHeader title="Privacy controls" subtitle="Choose how Kivo can use and show your data." />
              <ToggleRow icon={<Lock />} title="Allow personalization" checked={personalization} onClick={() => { const v = !personalization; setPersonalization(v); saveToggle('kivo.privacy.personalization', v); }} />
              <ToggleRow icon={<Database />} title="Allow memory" checked={memory} onClick={() => { const v = !memory; setMemory(v); saveToggle('kivo.privacy.memory', v); }} />
              <ToggleRow icon={<ShieldCheck />} title="Allow analytics" checked={analytics} onClick={() => { const v = !analytics; setAnalytics(v); saveToggle('kivo.privacy.analytics', v); }} />
              <ToggleRow icon={<Database />} title="Allow connected data usage" checked={connectedData} onClick={() => { const v = !connectedData; setConnectedData(v); saveToggle('kivo.privacy.connectedData', v); }} />
              <ToggleRow icon={<Lock />} title="Hide sensitive results" checked={hideSensitive} onClick={() => { const v = !hideSensitive; setHideSensitive(v); saveToggle('kivo.privacy.hideSensitive', v); }} />
              <ToggleRow icon={<ShieldCheck />} title="Require confirmation before actions" checked={confirmActions} onClick={() => { const v = !confirmActions; setConfirmActions(v); saveToggle('kivo.privacy.confirmActions', v); }} last />
            </Card>

            <Card>
              <SectionHeader title="Data controls" subtitle="Manage exports and local data cleanup." />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ActionButton icon={<Download />} label="Export privacy data" onClick={exportPrivacyData} />
                <ActionButton icon={<Trash2 />} label="Clear local history" onClick={() => setConfirmClear(true)} danger />
                <ActionButton icon={<Database />} label="Open Memory" onClick={() => router.push('/settings/memory')} />
                <ActionButton icon={<Database />} label="Open Data Sources" onClick={() => router.push('/settings/data-sources')} />
              </div>
            </Card>

            <div className="mt-5 flex items-center gap-4 rounded-[28px] border border-black/[0.055] bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
              <div className="flex h-13 w-13 items-center justify-center rounded-full border border-black/[0.055] bg-white"><ShieldCheck className="h-6 w-6" /></div>
              <div>
                <div className="text-[15px] font-semibold tracking-[-0.03em]">Your data is private and secure.</div>
                <p className="mt-1 text-[13px] text-black/45">Your data is private and secure. Kivo only uses your data to personalize your experience.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {confirmClear ? <ConfirmModal title="Clear local history?" desc="This removes local history and activity from this device." actionLabel="Clear history" onCancel={() => setConfirmClear(false)} onConfirm={clearHistory} /> : null}
    </main>
  );
}

function Card({ children }: { children: ReactNode }) { return <div className="mb-5 rounded-[28px] border border-black/[0.055] bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">{children}</div>; }
function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) { return <div className="mb-5"><h2 className="text-[18px] font-semibold tracking-[-0.035em]">{title}</h2><p className="mt-1 text-[13px] text-black/45">{subtitle}</p></div>; }
function StatusPill({ label, value }: { label: string; value: string }) { return <div className="rounded-[18px] border border-black/[0.055] bg-white px-4 py-3"><div className="text-[12px] text-black/45">{label}</div><div className="mt-1 text-[16px] font-semibold tracking-[-0.03em]">{value}</div></div>; }
function ToggleRow({ icon, title, checked, onClick, last = false }: { icon: ReactNode; title: string; checked: boolean; onClick: () => void; last?: boolean }) { return <button onClick={onClick} className={["flex w-full items-center gap-4 py-4 text-left", last ? '' : 'border-b border-black/[0.045]'].join(' ')}><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-black/[0.035] [&>svg]:h-5 [&>svg]:w-5">{icon}</div><div className="min-w-0 flex-1 text-[15px] font-semibold tracking-[-0.03em]">{title}</div><span className={["relative h-7 w-12 rounded-full transition", checked ? 'bg-[#111318]' : 'bg-black/10'].join(' ')}><span className={["absolute top-1 h-5 w-5 rounded-full bg-white transition", checked ? 'left-6' : 'left-1'].join(' ')} /></span></button>; }
function ActionButton({ icon, label, onClick, danger = false }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) { return <button onClick={onClick} className={["inline-flex items-center justify-center gap-3 rounded-[17px] border border-black/[0.055] bg-white px-5 py-4 text-[14px] font-medium shadow-[0_8px_22px_rgba(15,23,42,0.018)]", danger ? 'text-red-500' : ''].join(' ')}><span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>{label}</button>; }
function ConfirmModal({ title, desc, actionLabel, onCancel, onConfirm }: { title: string; desc: string; actionLabel: string; onCancel: () => void; onConfirm: () => void; }) { return <div className="fixed inset-0 z-[80] flex items-end bg-black/25 p-4 backdrop-blur-sm sm:items-center sm:justify-center"><div className="w-full rounded-[28px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:max-w-[420px]"><div className="text-[20px] font-semibold tracking-[-0.04em]">{title}</div><p className="mt-2 text-[14px] leading-[1.45] text-black/50">{desc}</p><div className="mt-6 grid grid-cols-2 gap-3"><button onClick={onCancel} className="rounded-[16px] bg-black/[0.045] px-4 py-3 text-[14px] font-medium">Cancel</button><button onClick={onConfirm} className="rounded-[16px] bg-[#111318] px-4 py-3 text-[14px] font-medium text-white">{actionLabel}</button></div></div></div>; }
