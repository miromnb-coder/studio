'use client';

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
      <div className="pointer-events-auto rounded-[32px] border border-[#e3e4e8] bg-[rgba(255,255,255,0.88)] p-4 shadow-[0_18px_50px_rgba(17,24,39,0.12)] backdrop-blur-xl">
        <div className="px-2">
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
            className="max-h-[120px] min-h-[28px] w-full resize-none border-0 bg-transparent p-0 text-[15px] leading-6 text-[#3d4450] outline-none placeholder:text-[#7d8593]"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
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

          <div className="flex items-center gap-2">
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
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full border transition ${
                canSend && !isSending
                  ? 'border-[#d7dae2] bg-[#eef1f6] text-[#6a7280] hover:bg-[#e7ebf2] active:scale-[0.98]'
                  : 'border-[#e3e5ea] bg-[#f3f4f7] text-[#b4bac5]'
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
  icon: React.ReactNode;
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
      className={`inline-flex h-12 w-12 items-center justify-center rounded-full border transition active:scale-[0.98] ${
        active
          ? 'border-[#cfd8ea] bg-[#eef4ff] text-[#4d6b9a]'
          : 'border-[#d9dde5] bg-[#f7f8fb] text-[#6f7785] hover:bg-white'
      }`}
    >
      {icon}
    </button>
  );
}
