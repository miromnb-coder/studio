'use client';

import { File, ImageIcon, X } from 'lucide-react';
import type { MessageAttachment } from '@/app/store/app-store';

type ComposerAttachmentChipProps = {
  attachment: MessageAttachment;
  onRemove: (attachmentId: string) => void;
};

export function ComposerAttachmentChip({ attachment, onRemove }: ComposerAttachmentChipProps) {
  const Icon = attachment.kind === 'image' ? ImageIcon : File;

  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#d5dbe5] bg-[#eef1f6] px-3 py-1.5 text-xs text-[#5c6472]">
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
      <span className="max-w-[170px] truncate font-medium">{attachment.name}</span>
      <button
        type="button"
        onClick={() => onRemove(attachment.id)}
        aria-label={`Remove ${attachment.name}`}
        className="rounded-full p-0.5 text-[#7d8594] transition-colors hover:bg-[#dfe5ee] hover:text-[#4f5868]"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
