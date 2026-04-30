'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
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
const MIN_KEYBOARD_OFFSET = 80;
const MAX_KEYBOARD_OFFSET = 430;
const KEYBOARD_TOP_GAP = 10;

function isEditableElement(value: Element | null) {
  if (!(value instanceof HTMLElement)) return false;
  const tag = value.tagName.toLowerCase();
  return tag === 'textarea' || tag === 'input' || value.isContentEditable;
}

function readKeyboardOffset() {
  if (typeof window === 'undefined') return 0;
  const viewport = window.visualViewport;
  if (!viewport || !isEditableElement(document.activeElement)) return 0;

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

    const syncDuringKeyboardAnimation = () => {
      sync();
      window.setTimeout(sync, 80);
      window.setTimeout(sync, 180);
      window.setTimeout(sync, 320);
    };

    sync();
    window.visualViewport?.addEventListener('resize', sync);
    window.visualViewport?.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('focusin', syncDuringKeyboardAnimation);
    window.addEventListener('focusout', syncDuringKeyboardAnimation);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      window.visualViewport?.removeEventListener('resize', sync);
      window.visualViewport?.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('focusin', syncDuringKeyboardAnimation);
      window.removeEventListener('focusout', syncDuringKeyboardAnimation);
    };
  }, []);

  return offset;
}

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
  const keyboardOffset = useComposerKeyboardOffset();
  const effectiveKeyboardOffset = keyboardOffset > 0 ? Math.max(0, keyboardOffset - KEYBOARD_TOP_GAP) : 0;

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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[560px] px-4 pb-5 transition-transform duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
      style={{ transform: `translate3d(0, ${-effectiveKeyboardOffset}px, 0)` }}
    >
      <div className="pointer-events-auto rounded-[34px] border border-white/60 bg-[rgba(255,255,255,0.54)] px-4 pb-3 pt-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur-[22px]">
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
                  ? 'border-white/75 bg-[rgba(255,255,255,0.78)] text-[#5d6674] shadow-[0_8px_20px_rgba(15,23,42,0.06)] hover:bg-[rgba(255,255,255,0.92)]'
                  : 'border-white/50 bg-[rgba(245,247,250,0.58)] text-[#b1b8c3]'
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
          ? 'border-[#d7e3f4] bg-[rgba(239,245,255,0.84)] text-[#4d6b9a] shadow-[0_6px_14px_rgba(77,107,154,0.08)]'
          : 'border-white/70 bg-[rgba(255,255,255,0.56)] text-[#6d7685] shadow-[0_6px_16px_rgba(15,23,42,0.04)] hover:bg-[rgba(255,255,255,0.78)]'
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
