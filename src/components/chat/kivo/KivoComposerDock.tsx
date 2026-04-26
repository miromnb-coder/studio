'use client';

import { memo, useCallback, useLayoutEffect, useRef, type ReactNode, type Ref } from 'react';
import { ArrowUp, BotMessageSquare, Mic, Plus, Workflow } from 'lucide-react';
import { triggerLightHaptic } from './haptics';

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

const MIN_TEXTAREA_HEIGHT = 30;
const MAX_TEXTAREA_HEIGHT = 140;

export const KivoComposerDock = memo(function KivoComposerDock({
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
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  }, [value]);

  const send = useCallback(() => {
    if (!canSend || isSending) return;
    triggerLightHaptic();
    onSend();
  }, [canSend, isSending, onSend]);

  const handlePlus = useCallback(() => {
    triggerLightHaptic();
    onPlusClick();
  }, [onPlusClick]);

  const handleQuick = useCallback(() => {
    triggerLightHaptic();
    onQuickActionClick();
  }, [onQuickActionClick]);

  const handleMic = useCallback(() => {
    triggerLightHaptic();
    onMicClick();
  }, [onMicClick]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-x-0 z-40 mx-auto w-full max-w-none px-[8px] pb-2 transition-transform duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        transform: `translate3d(${desktopShiftX}px, ${keyboardOffset > 0 ? -keyboardOffset : 0}px, 0)`,
      }}
    >
      <div className="pointer-events-auto rounded-[34px] border border-white/70 bg-[#fbfbfa]/96 px-[14px] pb-[9px] pt-[14px] shadow-[0_18px_42px_rgba(15,23,42,0.055),inset_0_1px_0_rgba(255,255,255,0.98)] backdrop-blur-2xl transition-[box-shadow,transform] duration-200 ease-out [contain:layout_paint] focus-within:shadow-[0_22px_50px_rgba(15,23,42,0.075),inset_0_1px_0_rgba(255,255,255,1)]">
        <textarea
          ref={textareaRef}
          id="kivo-composer-textarea"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder={placeholder}
          className="block w-full resize-none border-0 bg-transparent px-[16px] py-0 text-[18px] font-medium leading-[1.32] tracking-[-0.025em] text-[#22252b] outline-none placeholder:text-black/20"
          style={{ minHeight: `${MIN_TEXTAREA_HEIGHT}px`, maxHeight: `${MAX_TEXTAREA_HEIGHT}px`, overflowY: 'hidden' }}
        />

        <div className="mt-[13px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-[10px]">
            <DockCircleButton ariaLabel="Add attachment" onClick={handlePlus} icon={<Plus className="h-[22px] w-[22px]" strokeWidth={2.2} />} />
            <DockCircleButton ariaLabel="Connect tools" onClick={handleQuick} icon={<Workflow className="h-[21px] w-[21px]" strokeWidth={2.2} />} />
          </div>

          <div className="flex items-center gap-[10px]">
            <DockCircleButton ariaLabel="Open voice assistant" onClick={handleQuick} icon={<BotMessageSquare className="h-[21px] w-[21px]" strokeWidth={2.2} />} />
            <DockCircleButton ariaLabel={isListening ? 'Stop voice input' : 'Start voice input'} onClick={handleMic} active={isListening} icon={<Mic className="h-[21px] w-[21px]" strokeWidth={2.2} />} />
            <button
              type="button"
              onClick={send}
              aria-label="Send message"
              disabled={!canSend || isSending}
              className={`kivo-pressable inline-flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full transition-all duration-200 ease-out active:scale-[0.95] ${canSend && !isSending ? 'bg-[#1f2329] text-white shadow-[0_12px_24px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.12)]' : 'bg-[#eeeeee] text-[#cfcfcf] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]'}`}
            >
              <ArrowUp className="h-[22px] w-[22px]" strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

type DockCircleButtonProps = { ariaLabel: string; onClick: () => void; icon: ReactNode; active?: boolean };

const DockCircleButton = memo(function DockCircleButton({ ariaLabel, onClick, icon, active = false }: DockCircleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`kivo-pressable inline-flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full border transition-all duration-200 ease-out active:scale-[0.95] ${active ? 'border-black/[0.045] bg-[#f2f6ff] text-[#20242b] shadow-[0_8px_18px_rgba(15,23,42,0.055),inset_0_1px_0_rgba(255,255,255,0.98)]' : 'border-black/[0.025] bg-white/92 text-[#25272d] shadow-[0_8px_18px_rgba(15,23,42,0.045),inset_0_1px_0_rgba(255,255,255,0.98)]'}`}
    >
      {icon}
    </button>
  );
});
