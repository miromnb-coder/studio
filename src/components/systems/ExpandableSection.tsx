"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function ExpandableSection({ label, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-4 rounded-[2rem] border border-white/40 bg-white/20 overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-white/40 active:scale-[0.99]"
        aria-expanded={open}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</span>
        <div className={cn(
          "w-6 h-6 rounded-full bg-white/60 flex items-center justify-center transition-transform duration-500 shadow-sm",
          open ? "rotate-180" : ""
        )}>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="border-t border-white/40 p-6 text-sm text-slate-500 leading-relaxed font-medium bg-white/10">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
