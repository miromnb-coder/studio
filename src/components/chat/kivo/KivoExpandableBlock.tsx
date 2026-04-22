"use client";

import { useState } from "react";

type Props = {
  title: string;
  content: string;
};

export function KivoExpandableBlock({
  title,
  content,
}: Props) {
  const [open, setOpen] =
    useState(false);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
      <button
        onClick={() =>
          setOpen(!open)
        }
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-xs uppercase tracking-[0.2em] text-white/80">
          {title}
        </span>

        <span className="text-white/50">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/85">
          {content}
        </div>
      )}
    </div>
  );
}
