'use client';

import { useLayoutEffect, useRef, type ReactNode, type Ref } from 'react';
import { ArrowUp, BotMessageSquare, Mic, Plus, Workflow } from 'lucide-react';

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
  keyboardOffset?: number;
  containerRef?: Ref<HTMLDivElement>;
  desktopShiftX?: number;
};

const MIN_TEXTAREA_HEIGHT = 28;
const MAX_TEXTAREA_HEIGHT = 150;

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
  keyboardOffset = 0,
  containerRef,
  desktopShiftX = 0,
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
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-x-0 z-40 mx-auto w-full max-w-[560px] px-6 pb-4 md:translate-x-[var(--kivo-composer-shift-x)]"
      style={{
        ['--kivo-composer-shift-x' as string]: `${desktopShiftX}px`,
        bottom: `calc(env(safe-area-inset-bottom, 0px) + ${Math.max(0, keyboardOffset)}px)`,
      }}
    >
      <div className="pointer-events-auto rounded-[32px] border border-black/[0.025] bg-white px-[14px] pb-[10px] pt-[14px] shadow-[0_18px_42px_rgba(15,23,42,0.045)]">
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
          className="block w-full resize-none border-0 bg-transparent px-[14px] py-0 text-[17px] font-normal leading-[1.35] tracking-[-0.02em] text-[#25272d] outline-none placeholder:text-[#bfc2c7]"
          style={{
            minHeight: `${MIN_TEXTAREA_HEIGHT}px`,
            maxHeight: `${MAX_TEXTAREA_HEIGHT}px`,
            overflowY: 'hidden',
          }}
        />

        <div className="mt-[14px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-[8px]">
            <DockCircleButton
              ariaLabel="Add attachment"
              onClick={onPlusClick}
              icon={<Plus className="h-[23px] w-[23px]" strokeWidth={2.1} />}
            />

            <DockCircleButton
              ariaLabel="Connect tools"
              onClick={onQuickActionClick}
              icon={<Workflow className="h-[22px] w-[22px]" strokeWidth={2.1} />}
            />
          </div>

          <div className="flex items-center gap-[8px]">
            <DockCircleButton
              ariaLabel="Open voice assistant"
              onClick={onQuickActionClick}
              icon={
                <BotMessageSquare
                  className="h-[22px] w-[22px]"
                  strokeWidth={2.1}
                />
              }
            />

            <DockCircleButton
              ariaLabel={isListening ? 'Stop voice input' : 'Start voice input'}
              onClick={onMicClick}
              active={isListening}
              icon={<Mic className="h-[22px] w-[22px]" strokeWidth={2.1} />}
            />

            <button
              type="button"
              onClick={onSend}
              aria-label="Send message"
              disabled={!canSend || isSending}
              className={`inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full transition-all duration-200 ease-out active:scale-[0.96] ${
                canSend && !isSending
                  ? 'bg-[#1f2329] text-white shadow-[0_10px_22px_rgba(15,23,42,0.16)]'
                  : 'bg-[#f3f3f3] text-[#d6d6d6]'
              }`}
            >
              <ArrowUp className="h-[22px] w-[22px]" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type DockCircleButtonProps = {
  ariaLabel: string;
  onClick: () => void;
  icon: ReactNode;
  active?: boolean;
};

function DockCircleButton({
  ariaLabel,
  onClick,
  icon,
  active = false,
}: DockCircleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full border transition-all duration-200 ease-out active:scale-[0.96] ${
        active
          ? 'border-black/[0.06] bg-[#f0f5ff] text-[#1f2937] shadow-[0_5px_14px_rgba(15,23,42,0.06)]'
          : 'border-black/[0.035] bg-white text-[#25272d] shadow-[0_5px_14px_rgba(15,23,42,0.035)]'
      }`}
    >
      {icon}
    </button>
  );
}
