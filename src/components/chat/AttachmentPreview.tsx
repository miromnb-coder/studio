'use client';

import { FileText, ImageIcon } from 'lucide-react';
import type { MessageAttachment } from '@/app/store/app-store';

type AttachmentPreviewProps = {
  attachments: MessageAttachment[];
};

const formatBytes = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export function AttachmentPreview({ attachments }: AttachmentPreviewProps) {
  return (
    <div className="mt-2 space-y-2">
      {attachments.map((attachment) => {
        const isImage = attachment.kind === 'image';
        return (
          <div
            key={attachment.id}
            className="overflow-hidden rounded-xl border border-[#d8dde5] bg-[#f5f7fb]"
          >
            {isImage && attachment.previewUrl ? (
              <img src={attachment.previewUrl} alt={attachment.name} className="max-h-48 w-full object-cover" />
            ) : null}
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#657082]">
              {isImage ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
              <span className="truncate font-medium">{attachment.name}</span>
              <span className="ml-auto shrink-0 text-[#8590a3]">{formatBytes(attachment.size)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
