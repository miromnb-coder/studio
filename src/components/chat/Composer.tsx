'use client';

import type { RefObject } from 'react';
import { ArrowUp, Mic, Plus, Sparkles } from 'lucide-react';
import { ComposerButton } from './ComposerButton';

type ComposerProps = {
  value: string;
  isSending: boolean;
  listening: boolean;
  createOpen: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onOpenCreate: () => void;
  onOpenTools: () => void;
  onToggleMic: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
};

export function Composer({
  value,
  isSending,
  listening,
  createOpen,
  onChange,
  onSend,
  onOpenCreate,
  onOpenTools,
  onToggleMic,
  inputRef,
}: ComposerProps) {
  const hasText = value.trim().length > 0;

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-[calc(14px+env(safe-area-inset-bottom))] z-10 sm:inset-x-6">
      <div className="pointer-events-auto rounded-[26px] border border-[#d9dde4] bg-[#f4f5f8] px-4 pb-3 pt-3 shadow-[0_10px_22px_rgba(70,76,90,0.06)]">
        <label htmlFor="chat-composer" className="sr-only">
          Assign a task or ask anything
        </label>

        <input
          ref={inputRef}
          id="chat-composer"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Message Kivo..."
          className="mb-3 w-full bg-transparent px-1 text-[16px] font-normal text-[#717988] placeholder:text-[#a1a7b4] outline-none"
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ComposerButton label="Quick create" onClick={onOpenCreate} active={createOpen} variant="quick-create">
              <Plus className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </ComposerButton>

            <ComposerButton label="Open tools" onClick={onOpenTools}>
              <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </ComposerButton>
          </div>

          <div className="flex items-center gap-2.5">
            <ComposerButton label="Microphone" onClick={onToggleMic} active={listening}>
              <Mic className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </ComposerButton>

            <ComposerButton label="Send" onClick={onSend} disabled={!hasText || isSending}>
              <ArrowUp className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </ComposerButton>
          </div>
        </div>
      </div>
    </div>
  );
}
