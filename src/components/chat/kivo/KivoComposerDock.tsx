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

const MIN_TEXTAREA_HEIGHT = 27;
const MAX_TEXTAREA_HEIGHT = 120;

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
      className="pointer-events-none fixed inset-x-0 z-40 mx-auto w-full max-w-none px-[22px] pb-2 transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        transform: `translate3d(${desktopShiftX}px, ${keyboardOffset > 0 ? -keyboardOffset : 0}px, 0)`,
      }}
    >
      <div className="pointer-events-auto overflow-hidden rounded-[31px] border border-white/80 bg-white/88 px-[12px] pb-[10px] pt-[14px] shadow-[0_18px_48px_rgba(15,23,42,0.075),inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-2xl transition-[box-shadow,transform,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] [contain:layout_paint] focus-within:bg-white/94 focus-within:shadow-[0_22px_58px_rgba(15,23,42,0.105),inset_0_1px_0_rgba(255,255,255,1)]">
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
          className="block w-full resize-none border-0 bg-transparent px-[16px] py-0 text-[18px] font-normal leading-[1.33] tracking-[-0.028em] text-[#1F2530] outline-none placeholder:text-[#B8BBC0]"
          style={{ minHeight: `${MIN_TEXTAREA_HEIGHT}px`, maxHeight: `${MAX_TEXTAREA_HEIGHT}px`, overflowY: 'hidden' }}
        />

        <div className="mt-[15px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-[8px]">
            <DockCircleButton ariaLabel="Add attachment" onClick={handlePlus} icon={<Plus className="h-[22px] w-[22px]" strokeWidth={2.2} />} />
            <DockCircleButton ariaLabel="Connect tools" onClick={handleQuick} icon={<Workflow className="h-[20px] w-[20px]" strokeWidth={2.2} />} />
          </div>

          <div className="flex items-center gap-[8px]">
            <DockCircleButton ariaLabel="Open voice assistant" onClick={handleQuick} icon={<BotMessageSquare className="h-[20px] w-[20px]" strokeWidth={2.2} />} />
            <DockCircleButton ariaLabel={isListening ? 'Stop voice input' : 'Start voice input'} onClick={handleMic} active={isListening} icon={<Mic className="h-[20px] w-[20px]" strokeWidth={2.2} />} />
            <button
              type="button"
              onClick={send}
              aria-label="Send message"
              disabled={!canSend || isSending}
              className={`kivo-pressable inline-flex h-[43px] w-[43px] shrink-0 items-center justify-center rounded-full transition-[transform,background-color,color,box-shadow,opacity] duration-220 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.94] ${canSend && !isSending ? 'bg-[#171A20] text-white shadow-[0_10px_22px_rgba(15,23,42,0.20),inset_0_1px_0_rgba(255,255,255,0.18)]' : 'bg-[#EEF0F2] text-[#D3D5D8] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]'}`}
            >
              <ArrowUp className="h-[20px] w-[20px]" strokeWidth={2.45} />
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
      className={`kivo-pressable inline-flex h-[43px] w-[43px] shrink-0 items-center justify-center rounded-full border transition-[transform,background-color,color,box-shadow,border-color] duration-220 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.94] ${active ? 'border-black/[0.045] bg-[#F1F5FF] text-[#171A20] shadow-[0_7px_16px_rgba(15,23,42,0.045),inset_0_1px_0_rgba(255,255,255,0.9)]' : 'border-black/[0.035] bg-white/78 text-[#20242C] shadow-[0_7px_16px_rgba(15,23,42,0.035),inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-xl'}`}
    >
      {icon}
    </button>
  );
});
