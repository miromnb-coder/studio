'use client';

import type { RefObject } from 'react';
import { Mic, Plus, Send, Speech, Wrench } from 'lucide-react';
import { ComposerButton } from './ComposerButton';

type ComposerProps = {
  value: string;
  isSending: boolean;
  listening: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onOpenCreate: () => void;
  onOpenConnectors: () => void;
  onVoiceUtility: () => void;
  onToggleMic: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
};

export function Composer({
  value,
  isSending,
  listening,
  onChange,
  onSend,
  onOpenCreate,
  onOpenConnectors,
  onVoiceUtility,
  onToggleMic,
  inputRef,
}: ComposerProps) {
  const hasText = value.trim().length > 0;

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-[calc(14px+env(safe-area-inset-bottom))] z-10 sm:inset-x-6">
      <div className="pointer-events-auto rounded-[26px] border border-[#d9dde4] bg-[#f4f5f8] px-4 pb-3.5 pt-3.5 shadow-[0_10px_22px_rgba(70,76,90,0.06)]">
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
          placeholder="Assign a task or ask anything"
          className="mb-3.5 w-full bg-transparent px-1 text-[16px] font-normal text-[#717988] placeholder:text-[#a1a7b4] outline-none"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ComposerButton label="Add actions" onClick={onOpenCreate}>
              <Plus className="h-[17px] w-[17px]" strokeWidth={1.9} />
            </ComposerButton>

            <ComposerButton label="Open connectors" onClick={onOpenConnectors}>
              <Wrench className="h-[17px] w-[17px]" strokeWidth={1.9} />
            </ComposerButton>
          </div>

          <div className="flex items-center gap-2">
            <ComposerButton label="Voice utility" onClick={onVoiceUtility}>
              <Speech className="h-[17px] w-[17px]" strokeWidth={1.9} />
            </ComposerButton>

            <ComposerButton label="Microphone" onClick={onToggleMic} active={listening}>
              <Mic className="h-[17px] w-[17px]" strokeWidth={1.9} />
            </ComposerButton>

            <ComposerButton label="Send" onClick={onSend} disabled={!hasText || isSending}>
              <Send className="h-[17px] w-[17px]" strokeWidth={1.9} />
            </ComposerButton>
          </div>
        </div>
      </div>
    </div>
  );
}
