'use client';

import type { ReactNode } from 'react';
import { ArrowUp, Mic, Plus, Sparkles } from 'lucide-react';

type KivoComposerDockProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onPlusClick: () => void;
  onQuickActionClick: () => void;
  onMicClick: () => void;
  canSend: boolean;
  isListening?: boolean;
  isSending?: boolean;
  placeholder?: string;
};

export function KivoComposerDock({
  value,
  onChange,
  onSend,
  onPlusClick,
  onQuickActionClick,
  onMicClick,
  canSend,
  isListening = false,
  isSending = false,
  placeholder = 'Assign a task or ask anything',
}: KivoComposerDockProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[560px] px-4 pb-5">
      <div className="pointer-events-auto rounded-[34px] border border-black/[0.05] bg-[rgba(255,255,255,0.82)] px-5 pb-4 pt-4 shadow-[0_20px_60px_rgba(17,24,39,0.10)] backdrop-blur-2xl">
        <div className="px-1.5">
          <textarea
            id="kivo-composer-textarea"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (canSend && !isSending) onSend();
              }
            }}
            rows={1}
            placeholder={placeholder}
            className="max-h-[120px] min-h-[26px] w-full resize-none border-0 bg-transparent p-0 text-[15px] leading-6 text-[#3a404a] outline-none placeholder:text-[#8b919d]"
          />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DockIconButton
              ariaLabel="Add attachment"
              onClick={onPlusClick}
              icon={<Plus className="h-6 w-6" strokeWidth={1.8} />}
            />

            <DockIconButton
              ariaLabel="Open quick actions"
              onClick={onQuickActionClick}
              icon={<Sparkles className="h-5 w-5" strokeWidth={1.8} />}
            />
          </div>

          <div className="flex items-center gap-3">
            <DockIconButton
              ariaLabel={isListening ? 'Stop voice input' : 'Start voice input'}
              onClick={onMicClick}
              active={isListening}
              icon={<Mic className="h-5 w-5" strokeWidth={1.8} />}
            />

            <button
              type="button"
              onClick={onSend}
              aria-label="Send message"
              disabled={!canSend || isSending}
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-200 ease-out active:scale-[0.985] ${
                canSend && !isSending
                  ? 'border-black/[0.06] bg-[#eef1f5] text-[#69707d] hover:bg-[#e7ebf1]'
                  : 'border-black/[0.04] bg-[#f3f4f6] text-[#b8bec8]'
              }`}
            >
              <ArrowUp className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type DockIconButtonProps = {
  ariaLabel: string;
  onClick: () => void;
  icon: ReactNode;
  active?: boolean;
};

function DockIconButton({
  ariaLabel,
  onClick,
  icon,
  active = false,
}: DockIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-200 ease-out active:scale-[0.985] ${
        active
          ? 'border-[#cfd8ea] bg-[#eef4ff] text-[#4d6b9a]'
          : 'border-black/[0.05] bg-[#f7f8fb] text-[#6f7785] hover:bg-white'
      }`}
    >
      {icon}
    </button>
  );
}
