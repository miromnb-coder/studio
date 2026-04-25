'use client';

import Image from 'next/image';
import { Bot, BrainCircuit, CalendarDays, CreditCard, Globe2, TerminalSquare } from 'lucide-react';

export function getToolDisplayName(tool?: string) {
  const normalized = String(tool || '').toLowerCase();
  if (normalized.includes('gmail')) return 'Gmail';
  if (normalized.includes('calendar')) return 'Google Calendar';
  if (normalized.includes('memory')) return 'Memory';
  if (normalized.includes('finance')) return 'Finance';
  if (normalized.includes('web')) return 'Web';
  if (normalized.includes('terminal')) return 'Terminal';
  if (normalized.includes('response')) return 'Kivo';
  if (normalized.includes('planner') || normalized.includes('task')) return 'Planner';
  return 'Kivo';
}

export function ToolServiceIcon({ tool }: { tool?: string }) {
  const normalized = String(tool || '').toLowerCase();

  if (normalized.includes('gmail')) {
    return (
      <span className="relative inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-[9px] bg-white shadow-[0_1px_4px_rgba(15,23,42,0.08)]">
        <span className="absolute left-[7px] top-[8px] h-[12px] w-[3px] rounded-full bg-[#4285f4]" />
        <span className="absolute right-[7px] top-[8px] h-[12px] w-[3px] rounded-full bg-[#34a853]" />
        <span className="absolute left-[8px] top-[7px] h-[3px] w-[11px] origin-left rotate-[34deg] rounded-full bg-[#ea4335]" />
        <span className="absolute right-[8px] top-[7px] h-[3px] w-[11px] origin-right rotate-[-34deg] rounded-full bg-[#fbbc04]" />
        <span className="absolute left-[11px] top-[11px] h-[3px] w-[6px] rounded-full bg-[#ea4335]" />
      </span>
    );
  }

  if (normalized.includes('calendar')) {
    return (
      <span className="relative inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-[9px] bg-white shadow-[0_1px_4px_rgba(15,23,42,0.08)]">
        <span className="absolute inset-[5px] rounded-[4px] border border-[#d7dce6] bg-white" />
        <span className="absolute left-[6px] right-[6px] top-[6px] h-[5px] rounded-t-[3px] bg-[#4285f4]" />
        <span className="absolute bottom-[6px] left-[6px] h-[8px] w-[7px] bg-[#34a853]" />
        <span className="absolute bottom-[6px] right-[6px] h-[8px] w-[7px] bg-[#fbbc04]" />
        <span className="absolute bottom-[6px] left-[13px] h-[8px] w-[7px] bg-[#ea4335]" />
        <span className="relative mt-[4px] text-[10px] font-bold leading-none text-[#1f2937]">31</span>
      </span>
    );
  }

  if (normalized.includes('memory')) {
    return <BrainCircuit className="h-[18px] w-[18px] text-[#6c5ce7]" />;
  }

  if (normalized.includes('finance')) {
    return <CreditCard className="h-[18px] w-[18px] text-[#16a34a]" />;
  }

  if (normalized.includes('web')) {
    return <Globe2 className="h-[18px] w-[18px] text-[#2563eb]" />;
  }

  if (normalized.includes('terminal')) {
    return <TerminalSquare className="h-[18px] w-[18px] text-[#3f3f46]" />;
  }

  if (normalized.includes('response') || normalized.includes('kivo')) {
    return (
      <Image src="/icon.svg" alt="Kivo" width={20} height={20} className="h-5 w-5 object-contain" />
    );
  }

  return <Bot className="h-[18px] w-[18px] text-[#4b5563]" />;
}
