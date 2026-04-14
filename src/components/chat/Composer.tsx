'use client';

import {
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowUp,
  Loader2,
  Mic,
  Plus,
  Sparkles,
} from 'lucide-react';
import type { MessageAttachment } from '@/app/store/app-store';
import { ComposerAttachmentChip } from './ComposerAttachmentChip';

type ComposerProps = {
  value: string;
  isSending: boolean;
  listening: boolean;
  createOpen: boolean;
  attachments: MessageAttachment[];
  onChange: (value: string) => void;
  onSend: () => void;
  onOpenCreate: () => void;
  onOpenTools: () => void;
  onToggleMic: () => void;
  onRemoveAttachment: (attachmentId: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
};

type ComposerIconButtonProps = {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  strong?: boolean;
  children: ReactNode;
};

const COMPOSER_MIN_HEIGHT = 26;
const COMPOSER_EXPANDED_MAX_HEIGHT = 180;

function ComposerIconButton({
  label,
  onClick,
  active = false,
  disabled = false,
  strong = false,
  children,
}: ComposerIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200',
        'active:scale-[0.97]',
        strong
          ? disabled
            ? 'border-[#e5e7eb] bg-[#f3f4f6] text-[#b9c1cb] shadow-none'
            : 'border-[#121826] bg-[#121826] text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]'
          : active
            ? 'border-[#d6dde6] bg-[#edf1f5] text-[#586576] shadow-[0_6px_14px_rgba(15,23,42,0.06)]'
            : 'border-[#e3e7ec] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.98))] text-[#6c7685] shadow-[0_4px_12px_rgba(15,23,42,0.045)]',
        disabled ? 'cursor-not-allowed opacity-65' : 'hover:border-[#d7dde5]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function ComposerActionButton({
  label,
  onClick,
  active = false,
  icon,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[
        'inline-flex h-10 items-center gap-2 rounded-full border px-3 transition-all duration-200',
        'active:scale-[0.97]',
        active
          ? 'border-[#d6dde6] bg-[#edf1f5] text-[#556274] shadow-[0_6px_14px_rgba(15,23,42,0.06)]'
          : 'border-[#e3e7ec] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.98))] text-[#6c7685] shadow-[0_4px_12px_rgba(15,23,42,0.045)]',
      ].join(' ')}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-[13px] font-medium tracking-[-0.01em]">
        {label}
      </span>
    </button>
  );
}

export function Composer({
  value,
  isSending,
  listening,
  createOpen,
  attachments,
  onChange,
  onSend,
  onOpenCreate,
  onOpenTools,
  onToggleMic,
  onRemoveAttachment,
  inputRef,
}: ComposerProps) {
  const innerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const hasText = value.trim().length > 0;
  const hasAttachments = attachments.length > 0;
  const canSend = (hasText || hasAttachments) && !isSending;
  const isExpanded = isFocused || hasText || hasAttachments;
  const hasOverflow = useMemo(
    () => value.length > 160 || value.includes('\n'),
    [value],
  );

  useEffect(() => {
    if (!inputRef) return;

    (inputRef as RefObject<HTMLInputElement | null>).current =
      innerTextareaRef.current as unknown as HTMLInputElement | null;
  }, [inputRef]);

  useEffect(() => {
    const textarea = innerTextareaRef.current;
    if (!textarea) return;

    textarea.style.height = '0px';

    const nextHeight = Math.max(
      COMPOSER_MIN_HEIGHT,
      Math.min(textarea.scrollHeight, COMPOSER_EXPANDED_MAX_HEIGHT),
    );

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > COMPOSER_EXPANDED_MAX_HEIGHT ? 'auto' : 'hidden';
  }, [value, isExpanded]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-[calc(14px+env(safe-area-inset-bottom))] z-20 sm:inset-x-6">
      <div
        className={[
          'pointer-events-auto overflow-hidden rounded-[32px] border bg-white backdrop-blur-xl transition-all duration-300',
          'shadow-[0_20px_46px_rgba(15,23,42,0.10),0_2px_8px_rgba(15,23,42,0.04)]',
          isExpanded
            ? 'border-[#dfe5ec]'
            : 'border-[#e5e9ee]',
        ].join(' ')}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[rgba(255,255,255,0.88)]" />

        <div className="px-4 pb-3 pt-4">
          <label htmlFor="chat-composer" className="sr-only">
            Ask Kivo anything
          </label>

          <div
            className={[
              'rounded-[24px] transition-all duration-300',
              isExpanded ? 'min-h-[72px]' : 'min-h-[34px]',
            ].join(' ')}
          >
            <textarea
              ref={innerTextareaRef}
              id="chat-composer"
              value={value}
              rows={1}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask Kivo anything..."
              className={[
                'w-full resize-none bg-transparent px-0 py-0.5 text-[17px] font-normal tracking-[-0.02em] text-[#374151] outline-none',
                'placeholder:text-[#a1a9b6]',
                'scrollbar-thin',
              ].join(' ')}
              style={{
                minHeight: `${COMPOSER_MIN_HEIGHT}px`,
                maxHeight: `${COMPOSER_EXPANDED_MAX_HEIGHT}px`,
                lineHeight: 1.55,
              }}
            />

            <div
              className={[
                'overflow-hidden text-[12px] leading-5 text-[#9ba4b0] transition-all duration-300',
                isExpanded
                  ? 'mt-1 max-h-8 opacity-100'
                  : 'max-h-0 opacity-0',
              ].join(' ')}
            >
              Plan, ask, compare, analyze, or start an agent task
            </div>
          </div>

          {hasAttachments ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <ComposerAttachmentChip
                  key={attachment.id}
                  attachment={attachment}
                  onRemove={onRemoveAttachment}
                />
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <ComposerIconButton
                label="Add"
                onClick={onOpenCreate}
                active={createOpen}
              >
                <Plus className="h-[17px] w-[17px]" strokeWidth={1.9} />
              </ComposerIconButton>

              <ComposerActionButton
                label="Tools"
                onClick={onOpenTools}
                icon={
                  <Sparkles className="h-[15px] w-[15px]" strokeWidth={1.9} />
                }
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <ComposerIconButton
                label="Microphone"
                onClick={onToggleMic}
                active={listening}
              >
                <Mic className="h-[17px] w-[17px]" strokeWidth={1.9} />
              </ComposerIconButton>

              <ComposerIconButton
                label="Send"
                onClick={onSend}
                disabled={!canSend}
                strong
              >
                {isSending ? (
                  <Loader2
                    className="h-[17px] w-[17px] animate-spin"
                    strokeWidth={2}
                  />
                ) : (
                  <ArrowUp className="h-[17px] w-[17px]" strokeWidth={2.15} />
                )}
              </ComposerIconButton>
            </div>
          </div>

          <div
            className={[
              'overflow-hidden transition-all duration-300',
              isExpanded && hasOverflow
                ? 'mt-2 max-h-6 opacity-100'
                : 'max-h-0 opacity-0',
            ].join(' ')}
          >
            <div className="text-[11px] font-medium tracking-[0.01em] text-[#a1a9b6]">
              Shift + Enter for a new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
