'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AppShell, PremiumCard, ProductPageHeader, SectionHeader, SmartButton } from '../components/premium-ui';

const STORAGE_KEY = 'kivo_focus_execution_room_v1';

export default function FocusPage() {
  const [task, setTask] = useState('Ship connector architecture');
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [notes, setNotes] = useState('');
  const [blockers, setBlockers] = useState<string[]>([]);
  const [blockerInput, setBlockerInput] = useState('');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [minutesFocused, setMinutesFocused] = useState(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    setTask(String(parsed.task || 'Ship connector architecture'));
    setSecondsLeft(Number(parsed.secondsLeft || 25 * 60));
    setNotes(String(parsed.notes || ''));
    setBlockers(Array.isArray(parsed.blockers) ? parsed.blockers.filter((item) => typeof item === 'string') : []);
    setSessionsCompleted(Number(parsed.sessionsCompleted || 0));
    setMinutesFocused(Number(parsed.minutesFocused || 0));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ task, running, secondsLeft, notes, blockers, sessionsCompleted, minutesFocused }),
    );
  }, [task, running, secondsLeft, notes, blockers, sessionsCompleted, minutesFocused]);

  useEffect(() => {
    if (!running) {
      if (tickRef.current) window.clearInterval(tickRef.current);
      return;
    }
    tickRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          setSessionsCompleted((s) => s + 1);
          return 0;
        }
        return prev - 1;
      });
      setMinutesFocused((prev) => prev + 1 / 60);
    }, 1000);

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [running]);

  const formatted = useMemo(() => {
    const min = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const sec = Math.floor(secondsLeft % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }, [secondsLeft]);

  const aiNextStep = blockers.length
    ? `Clear blocker: "${blockers[0]}" then restart a 25-min sprint.`
    : task
      ? `Start now: break "${task}" into the next 3 concrete actions.`
      : 'Define one task and start a 25-minute sprint.';

  return (
    <AppShell>
      <ProductPageHeader pageTitle="Execution Room" pageSubtitle="Run deep work sessions and ship outcomes" />
      <div className="space-y-3">
        <PremiumCard className="space-y-3 p-4">
          <SectionHeader title="Current Focus Task" subtitle="Single active objective" />
          <input value={task} onChange={(e) => setTask(e.target.value)} className="w-full rounded-xl border border-[#e4e8ef] bg-white px-3 py-2 text-sm" placeholder="What are you executing right now?" />
          <div className="grid grid-cols-2 gap-2">
            <SmartButton onClick={() => setRunning(true)}>Start task</SmartButton>
            <SmartButton variant="secondary" onClick={() => { setRunning(false); setTask(''); }}>Complete task</SmartButton>
          </div>
        </PremiumCard>

        <PremiumCard className="space-y-3 p-4">
          <SectionHeader title="Focus Timer" subtitle="Start, pause, resume, reset" />
          <p className="text-center text-4xl font-semibold text-[#111]">{formatted}</p>
          <div className="grid grid-cols-4 gap-2">
            <SmartButton onClick={() => setRunning(true)}>Start</SmartButton>
            <SmartButton variant="secondary" onClick={() => setRunning(false)}>Pause</SmartButton>
            <SmartButton variant="secondary" onClick={() => setRunning(true)}>Resume</SmartButton>
            <SmartButton variant="secondary" onClick={() => { setRunning(false); setSecondsLeft(25 * 60); }}>Reset</SmartButton>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <SmartButton variant="ghost" onClick={() => setSecondsLeft(25 * 60)}>25m sprint</SmartButton>
            <SmartButton variant="ghost" onClick={() => setSecondsLeft(50 * 60)}>50m deep work</SmartButton>
            <SmartButton variant="ghost" onClick={() => setSecondsLeft(40 * 60)}>Custom 40m</SmartButton>
          </div>
        </PremiumCard>

        <PremiumCard className="space-y-3 p-4">
          <SectionHeader title="AI Next Step" subtitle="Immediate execution recommendation" />
          <p className="rounded-xl border border-[#e4e8ef] bg-white px-3 py-2 text-sm text-[#4d5562]">{aiNextStep}</p>
        </PremiumCard>

        <PremiumCard className="space-y-3 p-4">
          <SectionHeader title="Blockers" subtitle="Track and clear obstacles" />
          <div className="flex gap-2"><input value={blockerInput} onChange={(e) => setBlockerInput(e.target.value)} className="flex-1 rounded-xl border px-3 py-2 text-sm" placeholder="Add blocker" /><SmartButton variant="secondary" onClick={() => { if (!blockerInput.trim()) return; setBlockers((prev) => [...prev, blockerInput.trim()]); setBlockerInput(''); }}>Add</SmartButton></div>
          {blockers.map((blocker) => <button key={blocker} onClick={() => setBlockers((prev) => prev.filter((item) => item !== blocker))} type="button" className="block w-full rounded-xl border border-[#e8d9d9] bg-[#fff7f7] px-3 py-2 text-left text-xs">Clear blocker: {blocker}</button>)}
        </PremiumCard>

        <PremiumCard className="space-y-3 p-4">
          <SectionHeader title="Session Notes" subtitle="Capture decisions quickly" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="h-24 w-full rounded-xl border px-3 py-2 text-sm" placeholder="Write quick notes for this session" />
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="Today Progress" subtitle="Live execution metrics" />
          <p className="text-sm">Completed sessions: <strong>{sessionsCompleted}</strong></p>
          <p className="text-sm">Total focused minutes: <strong>{Math.round(minutesFocused)}</strong></p>
        </PremiumCard>
      </div>
    </AppShell>
  );
}
