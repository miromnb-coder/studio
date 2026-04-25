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

const MIN_TEXTAREA_HEIGHT = 26;
const MAX_TEXTAREA_HEIGHT = 140;

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
      className="pointer-events-none fixed inset-x-0 z-40 mx-auto w-full max-w-none px-[8px] pb-2 md:translate-x-[var(--kivo-composer-shift-x)]"
      style={{
        ['--kivo-composer-shift-x' as string]: `${desktopShiftX}px`,
        bottom: `calc(env(safe-area-inset-bottom, 0px) + ${Math.max(0, keyboardOffset)}px)`,
      }}
    >
      <div className="pointer-events-auto rounded-[31px] border border-black/[0.018] bg-white px-[13px] pb-[8px] pt-[12px] shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
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
          className="block w-full resize-none border-0 bg-transparent px-[14px] py-0 text-[16px] font-normal leading-[1.35] tracking-[-0.02em] text-[#25272d] outline-none placeholder:text-[#cfcfcf]"
          style={{
            minHeight: `${MIN_TEXTAREA_HEIGHT}px`,
            maxHeight: `${MAX_TEXTAREA_HEIGHT}px`,
            overflowY: 'hidden',
          }}
        />

        <div className="mt-[12px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-[8px]">
            <DockCircleButton
              ariaLabel="Add attachment"
              onClick={onPlusClick}
              icon={<Plus className="h-[21px] w-[21px]" strokeWidth={2.15} />}
            />

            <DockCircleButton
              ariaLabel="Connect tools"
              onClick={onQuickActionClick}
              icon={<Workflow className="h-[20px] w-[20px]" strokeWidth={2.15} />}
            />
          </div>

          <div className="flex items-center gap-[8px]">
            <DockCircleButton
              ariaLabel="Open voice assistant"
              onClick={onQuickActionClick}
              icon={<BotMessageSquare className="h-[20px] w-[20px]" strokeWidth={2.15} />}
            />

            <DockCircleButton
              ariaLabel={isListening ? 'Stop voice input' : 'Start voice input'}
              onClick={onMicClick}
              active={isListening}
              icon={<Mic className="h-[20px] w-[20px]" strokeWidth={2.15} />}
            />

            <button
              type="button"
              onClick={onSend}
              aria-label="Send message"
              disabled={!canSend || isSending}
              className={`inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full transition-all duration-200 ease-out active:scale-[0.96] ${
                canSend && !isSending
                  ? 'bg-[#1f2329] text-white shadow-[0_10px_22px_rgba(15,23,42,0.16)]'
                  : 'bg-[#ededed] text-[#d4d4d4]'
              }`}
            >
              <ArrowUp className="h-[20px] w-[20px]" strokeWidth={2.35} />
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
      className={`inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border transition-all duration-200 ease-out active:scale-[0.96] ${
        active
          ? 'border-black/[0.055] bg-[#f0f5ff] text-[#1f2937] shadow-[0_5px_14px_rgba(15,23,42,0.05)]'
          : 'border-black/[0.03] bg-white text-[#25272d] shadow-[0_5px_14px_rgba(15,23,42,0.03)]'
      }`}
    >
      {icon}
    </button>
  );
}
