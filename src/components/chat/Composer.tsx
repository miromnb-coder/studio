'use client';

import type { RefObject } from 'react';
import { ArrowUp, Mic, Plus, Sparkles } from 'lucide-react';
import type { MessageAttachment } from '@/app/store/app-store';
import { ComposerButton } from './ComposerButton';
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

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-[calc(14px+env(safe-area-inset-bottom))] z-10 sm:inset-x-6">
      <div className="surface-chat pointer-events-auto rounded-[28px] px-4 pb-3 pt-3 shadow-[0_16px_32px_rgba(71,85,105,0.12)]">
        <label htmlFor="chat-composer" className="sr-only">
          Assign a task or ask anything
        </label>

        <input
          ref={inputRef}
          id="chat-composer"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask Kivo anything..."
          className="mb-3 w-full bg-transparent px-1 text-[16px] font-normal text-[#4b5563] placeholder:text-[#9aa3b2] outline-none"
        />

        {hasAttachments ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <ComposerAttachmentChip key={attachment.id} attachment={attachment} onRemove={onRemoveAttachment} />
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ComposerButton label="Add" onClick={onOpenCreate} active={createOpen} variant="quick-create">
              <Plus className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </ComposerButton>

            <ComposerButton label="Open tools" onClick={onOpenTools}>
              <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </ComposerButton>
          </div>

          <div className="flex items-center gap-2.5">
            <ComposerButton label="Microphone" onClick={onToggleMic} active={listening}>
              <Mic className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </ComposerButton>

            <ComposerButton label="Send" onClick={onSend} disabled={(!hasText && !hasAttachments) || isSending}>
              <ArrowUp className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </ComposerButton>
          </div>
        </div>
      </div>
    </div>
  );
}
