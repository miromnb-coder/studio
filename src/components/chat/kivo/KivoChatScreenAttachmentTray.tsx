import type { RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Paperclip, X } from 'lucide-react';
import type { MessageAttachment } from '@/app/store/app-store';

type KivoChatScreenAttachmentTrayProps = {
  attachments: MessageAttachment[];
  keyboardOffset: number;
  attachmentTrayRef: RefObject<HTMLDivElement | null>;
  onRemoveAttachment: (attachmentId: string) => void;
};

export function KivoChatScreenAttachmentTray({
  attachments,
  keyboardOffset,
  attachmentTrayRef,
  onRemoveAttachment,
}: KivoChatScreenAttachmentTrayProps) {
  const hasAttachments = attachments.length > 0;

  return (
    <AnimatePresence initial={false}>
      {hasAttachments ? (
        <motion.div
          key="attachment-tray"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="pointer-events-none fixed inset-x-0 z-20 mx-auto w-full max-w-[560px] px-5"
          ref={attachmentTrayRef}
          style={{
            bottom: `calc(138px + env(safe-area-inset-bottom, 0px) + ${Math.max(0, keyboardOffset)}px)`,
          }}
        >
          <div className="pointer-events-auto mx-auto flex max-w-[500px] flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="inline-flex items-center gap-2 rounded-full border border-black/[0.05] bg-white/96 px-3 py-2 text-[12px] text-[#5e6573] shadow-[0_8px_22px_rgba(17,24,39,0.06)] backdrop-blur"
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span className="max-w-[150px] truncate">{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(attachment.id)}
                  aria-label={`Remove ${attachment.name}`}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[#7d8593] transition-all duration-200 ease-out hover:text-[#2f3640] active:scale-[0.97]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
