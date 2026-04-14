'use client';

import type { KeyboardEvent, RefObject } from 'react';
import {
  ArrowUp,
  Loader2,
  Mic,
  Paperclip,
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
  children: React.ReactNode;
};

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
        'inline-flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200',
        'active:scale-[0.98]',
        strong
          ? disabled
            ? 'border-[#e5e7eb] bg-[#f3f4f6] text-[#b7bfca] shadow-none'
            : 'border-[#111827] bg-[#111827] text-white shadow-[0_10px_22px_rgba(15,23,42,0.18)]'
          : active
            ? 'border-[#d7dee7] bg-[#eef2f6] text-[#566273] shadow-[0_6px_16px_rgba(15,23,42,0.07)]'
            : 'border-[#e1e5eb] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,247,250,0.98))] text-[#6b7280] shadow-[0_6px_16px_rgba(15,23,42,0.05)]',
        disabled ? 'cursor-not-allowed opacity-70' : 'hover:border-[#d3d9e2]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function ComposerActionPill({
  label,
  onClick,
  active = false,
  icon,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex h-11 items-center gap-2 rounded-full border px-3.5 transition-all duration-200',
        'active:scale-[0.98]',
        active
          ? 'border-[#d7dee7] bg-[#eef2f6] text-[#4a5565] shadow-[0_6px_16px_rgba(15,23,42,0.07)]'
          : 'border-[#e1e5eb] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,247,250,0.98))] text-[#687384] shadow-[0_6px_16px_rgba(15,23,42,0.05)]',
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
  const hasText = value.trim().length > 0;
  const hasAttachments = attachments.length > 0;
  const canSend = (hasText || hasAttachments) && !isSending;

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-[calc(14px+env(safe-area-inset-bottom))] z-20 sm:inset-x-6">
      <div className="pointer-events-auto overflow-hidden rounded-[32px] border border-[#e4e8ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,251,253,0.98))] shadow-[0_22px_48px_rgba(15,23,42,0.10),0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[rgba(255,255,255,0.88)]" />

        <div className="px-4 pb-3 pt-4">
          <label htmlFor="chat-composer" className="sr-only">
            Ask Kivo anything
          </label>

          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e5e8ed] bg-[linear-gradient(180deg,rgba(250,251,253,1),rgba(243,246,249,1))] text-[#8b96a4] shadow-[0_4px_12px_rgba(15,23,42,0.04)] sm:inline-flex">
                <Sparkles className="h-4 w-4" strokeWidth={1.9} />
              </div>

              <div className="min-w-0 flex-1">
                <input
                  ref={inputRef}
                  id="chat-composer"
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Kivo anything..."
                  className="w-full bg-transparent px-0 py-0.5 text-[18px] font-normal tracking-[-0.02em] text-[#374151] placeholder:text-[#a0a8b5] outline-none"
                />

                <div className="mt-1 text-[12px] leading-5 text-[#9aa3af]">
                  Plan, ask, compare, analyze, or start an agent task
                </div>
              </div>
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
                <Plus className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </ComposerIconButton>

              <ComposerActionPill
                label="Tools"
                onClick={onOpenTools}
                icon={<Sparkles className="h-[16px] w-[16px]" strokeWidth={1.9} />}
              />

              {hasAttachments ? (
                <div className="hidden items-center gap-1 rounded-full border border-[#e4e8ee] bg-[#f7f9fb] px-3 py-2 text-[12px] font-medium tracking-[-0.01em] text-[#7b8695] sm:inline-flex">
                  <Paperclip className="h-3.5 w-3.5" strokeWidth={1.9} />
                  {attachments.length} attached
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <ComposerIconButton
                label="Microphone"
                onClick={onToggleMic}
                active={listening}
              >
                <Mic className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </ComposerIconButton>

              <ComposerIconButton
                label="Send"
                onClick={onSend}
                disabled={!canSend}
                strong
              >
                {isSending ? (
                  <Loader2 className="h-[18px] w-[18px] animate-spin" strokeWidth={2} />
                ) : (
                  <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.1} />
                )}
              </ComposerIconButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
