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

const MIN_TEXTAREA_HEIGHT = 28;
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
      <div className="pointer-events-auto rounded-[30px] border border-black/[0.05] bg-[rgba(255,255,255,0.86)] px-4 pb-3 pt-4 shadow-[0_20px_50px_rgba(17,24,39,0.10)] backdrop-blur-2xl">
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
            className="w-full resize-none border-0 bg-transparent p-0 text-[16px] leading-6 text-[#39404a] outline-none placeholder:text-[#8b919d]"
            style={{
              minHeight: `${MIN_TEXTAREA_HEIGHT}px`,
              maxHeight: `${MAX_TEXTAREA_HEIGHT}px`,
              overflowY: 'hidden',
            }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DockIconButton
              ariaLabel="Add attachment"
              onClick={onPlusClick}
              icon={<Plus className="h-[18px] w-[18px]" strokeWidth={2.1} />}
            />

            <DockIconButton
              ariaLabel="Open quick actions"
              onClick={onQuickActionClick}
              icon={<MagicGlyph />}
            />
          </div>

          <div className="flex items-center gap-2">
            <DockIconButton
              ariaLabel={isListening ? 'Stop voice input' : 'Start voice input'}
              onClick={onMicClick}
              active={isListening}
              icon={<Mic className="h-[17px] w-[17px]" strokeWidth={2} />}
            />

            <button
              type="button"
              onClick={onSend}
              aria-label="Send message"
              disabled={!canSend || isSending}
              className={`inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border transition-all duration-200 ease-out active:scale-[0.985] ${
                canSend && !isSending
                  ? 'border-black/[0.06] bg-[#eef1f5] text-[#69707d] hover:bg-[#e7ebf1]'
                  : 'border-black/[0.04] bg-[#f3f4f6] text-[#b8bec8]'
              }`}
            >
              <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.2} />
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
          ? 'border-[#cfd8ea] bg-[#eef4ff] text-[#4d6b9a]'
          : 'border-black/[0.05] bg-[#f7f8fb] text-[#6f7785] hover:bg-white'
      }`}
    >
      {icon}
    </button>
  );
}

function MagicGlyph() {
  return (
    <div className="relative h-[18px] w-[18px]">
      <Sparkles
        className="absolute inset-0 h-[18px] w-[18px] text-[#6c7380]"
        strokeWidth={1.9}
      />
    </div>
  );
}
