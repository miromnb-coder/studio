"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function ExpandableSection({ label, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-4 rounded-[1.5rem] border border-slate-50 bg-slate-50/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-white rounded-[1.5rem]"
        aria-expanded={open}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-300" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-300" />}
      </button>

      <div
        className={cn(
          "grid overflow-hidden transition-all duration-300 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0">
          <div className="border-t border-slate-50 p-6 text-sm text-slate-500 leading-relaxed font-medium">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}