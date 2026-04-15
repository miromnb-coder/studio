'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
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

const MIN_TEXTAREA_HEIGHT = 30;
const MAX_TEXTAREA_HEIGHT = 180;

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
    const nextHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${Math.max(nextHeight, MIN_TEXTAREA_HEIGHT)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  }, [value]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[560px] px-4 pb-5">
      <div className="pointer-events-auto rounded-[34px] border border-white/70 bg-[rgba(255,255,255,0.72)] px-4 pb-3 pt-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-[28px]">
        <div className="px-2">
          <textarea
            ref={textareaRef}
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
            className="w-full resize-none border-0 bg-transparent p-0 text-[16px] font-normal leading-6 tracking-[-0.02em] text-[#3a404a] outline-none placeholder:text-[#97a0ad]"
            style={{
              minHeight: `${MIN_TEXTAREA_HEIGHT}px`,
              maxHeight: `${MAX_TEXTAREA_HEIGHT}px`,
              overflowY: 'hidden',
            }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <DockIconButton
              ariaLabel="Add attachment"
              onClick={onPlusClick}
              icon={<Plus className="h-[17px] w-[17px]" strokeWidth={2.2} />}
            />

            <DockIconButton
              ariaLabel="Open quick actions"
              onClick={onQuickActionClick}
              icon={<MagicGlyph />}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <DockIconButton
              ariaLabel={isListening ? 'Stop voice input' : 'Start voice input'}
              onClick={onMicClick}
              active={isListening}
              icon={<Mic className="h-[16px] w-[16px]" strokeWidth={2.1} />}
            />

            <button
              type="button"
              onClick={onSend}
              aria-label="Send message"
              disabled={!canSend || isSending}
              className={`inline-flex h-[46px] w-[46px] items-center justify-center rounded-full border transition-all duration-200 ease-out active:scale-[0.985] ${
                canSend && !isSending
                  ? 'border-white/80 bg-[rgba(255,255,255,0.88)] text-[#5d6674] shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:bg-white'
                  : 'border-white/60 bg-[rgba(245,247,250,0.82)] text-[#b1b8c3]'
              }`}
            >
              <ArrowUp className="h-[17px] w-[17px]" strokeWidth={2.35} />
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
      className={`inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border transition-all duration-200 ease-out active:scale-[0.985] ${
        active
          ? 'border-[#d7e3f4] bg-[rgba(239,245,255,0.92)] text-[#4d6b9a] shadow-[0_8px_18px_rgba(77,107,154,0.10)]'
          : 'border-white/80 bg-[rgba(255,255,255,0.72)] text-[#6d7685] shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:bg-white/88'
      }`}
    >
      {icon}
    </button>
  );
}

function MagicGlyph() {
  return (
    <div className="relative h-[17px] w-[17px]">
      <Sparkles
        className="absolute inset-0 h-[17px] w-[17px] text-[#697281]"
        strokeWidth={1.95}
      />
    </div>
  );
}
