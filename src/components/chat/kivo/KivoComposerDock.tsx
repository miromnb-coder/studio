'use client';

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import { ArrowUp, BotMessageSquare, Mic, Plus, Workflow } from 'lucide-react';
import { haptic } from '@/lib/haptics';

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
  onFocus?: () => void;
};

const MIN_TEXTAREA_HEIGHT = 25;
const MAX_TEXTAREA_HEIGHT = 112;
const KEYBOARD_TOP_GAP = 18;
const MIN_KEYBOARD_OFFSET = 80;
const MAX_KEYBOARD_OFFSET = 430;

function isEditableElement(value: Element | null) {
  if (!(value instanceof HTMLElement)) return false;
  const tag = value.tagName.toLowerCase();
  return tag === 'textarea' || tag === 'input' || value.isContentEditable;
}

function readKeyboardOffset() {
  if (typeof window === 'undefined') return 0;
  const viewport = window.visualViewport;
  const focused = isEditableElement(document.activeElement);
  if (!viewport || !focused) return 0;

  const rawOffset = window.innerHeight - viewport.height - viewport.offsetTop;
  if (!Number.isFinite(rawOffset) || rawOffset < MIN_KEYBOARD_OFFSET) return 0;
  return Math.max(0, Math.min(Math.round(rawOffset), MAX_KEYBOARD_OFFSET));
}

function useComposerKeyboardOffset() {
  const [offset, setOffset] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sync = () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        const nextOffset = readKeyboardOffset();
        setOffset((current) => (Math.abs(current - nextOffset) < 1 ? current : nextOffset));
      });
    };

    const syncSoon = () => {
      sync();
      window.setTimeout(sync, 80);
      window.setTimeout(sync, 220);
    };

    sync();
    window.visualViewport?.addEventListener('resize', sync);
    window.visualViewport?.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('focusin', syncSoon);
    window.addEventListener('focusout', syncSoon);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      window.visualViewport?.removeEventListener('resize', sync);
      window.visualViewport?.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('focusin', syncSoon);
      window.removeEventListener('focusout', syncSoon);
    };
  }, []);

  return offset;
}

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
  keyboardOffset,
  containerRef,
  desktopShiftX = 0,
  onFocus,
}: KivoComposerDockProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const measuredKeyboardOffset = useComposerKeyboardOffset();
  const resolvedKeyboardOffset = typeof keyboardOffset === 'number' ? keyboardOffset : measuredKeyboardOffset;
  const effectiveKeyboardOffset = resolvedKeyboardOffset > 0 ? Math.max(0, resolvedKeyboardOffset - KEYBOARD_TOP_GAP) : 0;

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
    haptic.medium();
    onSend();
  }, [canSend, isSending, onSend]);

  const handlePlus = useCallback(() => {
    haptic.light();
    onPlusClick();
  }, [onPlusClick]);

  const handleQuick = useCallback(() => {
    haptic.selection();
    onQuickActionClick();
  }, [onQuickActionClick]);

  const handleMic = useCallback(() => {
    haptic.selection();
    onMicClick();
  }, [onMicClick]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-x-0 z-40 mx-auto w-full max-w-none px-[10px] pb-2 transition-transform duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 30px)',
        transform: `translate3d(${desktopShiftX}px, ${-effectiveKeyboardOffset}px, 0)`,
      }}
    >
      <div className="pointer-events-auto overflow-hidden rounded-[29px] border border-white/85 bg-white/90 px-[10px] pb-[9px] pt-[11px] shadow-[0_14px_38px_rgba(15,23,42,0.068),inset_0_1px_0_rgba(255,255,255,0.98)] backdrop-blur-2xl transition-[box-shadow,transform,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] [contain:layout_paint] focus-within:bg-white/96 focus-within:shadow-[0_18px_48px_rgba(15,23,42,0.092),inset_0_1px_0_rgba(255,255,255,1)]">
        <textarea
          ref={textareaRef}
          id="kivo-composer-textarea"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder={placeholder}
          className="block w-full resize-none border-0 bg-transparent px-[15px] py-0 text-[17.5px] font-normal leading-[1.28] tracking-[-0.026em] text-[#1F2530] outline-none placeholder:text-[#B8BBC0]"
          style={{ minHeight: `${MIN_TEXTAREA_HEIGHT}px`, maxHeight: `${MAX_TEXTAREA_HEIGHT}px`, overflowY: 'hidden' }}
        />

        <div className="mt-[11px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-[7px]">
            <DockCircleButton ariaLabel="Add attachment" onClick={handlePlus} icon={<Plus className="h-[21px] w-[21px]" strokeWidth={2.2} />} />
            <DockCircleButton ariaLabel="Connect tools" onClick={handleQuick} icon={<Workflow className="h-[19px] w-[19px]" strokeWidth={2.2} />} />
          </div>

          <div className="flex items-center gap-[7px]">
            <DockCircleButton ariaLabel="Open voice assistant" onClick={handleQuick} icon={<BotMessageSquare className="h-[19px] w-[19px]" strokeWidth={2.2} />} />
            <DockCircleButton ariaLabel={isListening ? 'Stop voice input' : 'Start voice input'} onClick={handleMic} active={isListening} icon={<Mic className="h-[19px] w-[19px]" strokeWidth={2.2} />} />
            <button
              type="button"
              onClick={send}
              aria-label="Send message"
              disabled={!canSend || isSending}
              className={`kivo-pressable inline-flex h-[41px] w-[41px] shrink-0 items-center justify-center rounded-full transition-[transform,background-color,color,box-shadow,opacity] duration-220 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.94] ${canSend && !isSending ? 'bg-[#171A20] text-white shadow-[0_9px_20px_rgba(15,23,42,0.20),inset_0_1px_0_rgba(255,255,255,0.18)]' : 'bg-[#EEF0F2] text-[#D3D5D8] shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]'}`}
            >
              <ArrowUp className="h-[19px] w-[19px]" strokeWidth={2.45} />
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
      className={`kivo-pressable inline-flex h-[41px] w-[41px] shrink-0 items-center justify-center rounded-full border transition-[transform,background-color,color,box-shadow,border-color] duration-220 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.94] ${active ? 'border-black/[0.045] bg-[#F1F5FF] text-[#171A20] shadow-[0_6px_14px_rgba(15,23,42,0.042),inset_0_1px_0_rgba(255,255,255,0.9)]' : 'border-black/[0.035] bg-white/80 text-[#20242C] shadow-[0_6px_14px_rgba(15,23,42,0.032),inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-xl'}`}
    >
      {icon}
    </button>
  );
});
