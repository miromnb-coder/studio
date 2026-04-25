'use client';

import { useEffect, useMemo, type ComponentType } from 'react';
import { AnimatePresence, motion, type PanInfo, useDragControls } from 'framer-motion';
import {
  BotMessageSquare,
  Brain,
  CalendarClock,
  Camera,
  FileText,
  Globe,
  Link2,
  Mail,
  Mic,
  PiggyBank,
  Search,
  Sparkles,
  Target,
  Workflow,
  Zap,
} from 'lucide-react';
import type { MessageAttachment } from '@/app/store/app-store';

type AiActionId =
  | 'summarize-day'
  | 'find-priorities'
  | 'deep-research'
  | 'live-search';

type ProductivityToolId = 'gmail' | 'calendar' | 'money-saver' | 'tasks';

type ToolState = {
  connected: boolean;
  subtitle: string;
};

type KivoActionSheetProps = {
  open: boolean;
  isListening: boolean;
  attachments: MessageAttachment[];
  toolState: Record<ProductivityToolId, ToolState>;
  onClose: () => void;
  onAddImages: () => void;
  onAddFiles: () => void;
  onPasteLink: () => void;
  onVoiceInput: () => void;
  onAiAction: (id: AiActionId) => void;
  onToolAction: (id: ProductivityToolId) => void;
};

type SheetRowProps = {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  badge?: string;
  onClick: () => void;
};

export function KivoActionSheet({
  open,
  isListening,
  attachments,
  toolState,
  onClose,
  onAddImages,
  onAddFiles,
  onPasteLink,
  onVoiceInput,
  onAiAction,
  onToolAction,
}: KivoActionSheetProps) {
  const dragControls = useDragControls();

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const imagePreviews = useMemo(
    () => attachments.filter((item) => item.kind === 'image' && item.previewUrl),
    [attachments],
  );

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.y > 120 || info.velocity.y > 650) onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close action sheet"
            className="fixed inset-0 z-40 bg-black/28 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[86dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0_-18px_48px_rgba(0,0,0,0.16)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 330, damping: 34 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.16 }}
            onDragEnd={handleDragEnd}
          >
            <button
              type="button"
              onPointerDown={(event) => dragControls.start(event)}
              aria-label="Drag to dismiss"
              className="shrink-0 touch-none px-4 pb-3 pt-3"
            >
              <span className="mx-auto block h-1.5 w-16 rounded-full bg-black/20" />
            </button>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-[max(22px,env(safe-area-inset-bottom))]">
              <section className="border-b border-black/[0.08] pb-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[24px] font-semibold tracking-[-0.035em] text-[#222]">
                    Photos
                  </h2>
                  <button
                    type="button"
                    onClick={onAddImages}
                    className="text-[19px] font-semibold tracking-[-0.02em] text-[#0a84ff]"
                  >
                    See all
                  </button>
                </div>

                <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      onAddImages();
                      onClose();
                    }}
                    className="flex h-[112px] w-[112px] shrink-0 flex-col items-center justify-center rounded-[22px] bg-[#f2f2f2] text-[#2b2b2b] transition active:scale-[0.985]"
                  >
                    <Camera className="h-8 w-8" strokeWidth={2.2} />
                    <span className="mt-3 text-[18px] font-normal tracking-[-0.02em]">
                      Camera
                    </span>
                  </button>

                  {imagePreviews.map((image) => (
                    <div
                      key={image.id}
                      className="h-[112px] w-[112px] shrink-0 overflow-hidden rounded-[22px] bg-[#f2f2f2]"
                    >
                      <img
                        src={image.previewUrl}
                        alt={image.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}

                  <MiniPhotoPlaceholder icon={FileText} />
                  <MiniPhotoPlaceholder icon={Link2} />
                  <MiniPhotoPlaceholder icon={Sparkles} />
                </div>
              </section>

              <section className="pt-5">
                <SheetRow
                  icon={FileText}
                  title="Add files"
                  onClick={() => {
                    onAddFiles();
                    onClose();
                  }}
                />

                <SheetRow
                  icon={Mail}
                  title={toolState.gmail.connected ? 'Open Gmail' : 'Connect Gmail'}
                  onClick={() => {
                    onToolAction('gmail');
                    onClose();
                  }}
                />

                <SheetRow
                  icon={CalendarClock}
                  title={
                    toolState.calendar.connected
                      ? 'Open Calendar'
                      : 'Connect Calendar'
                  }
                  onClick={() => {
                    onToolAction('calendar');
                    onClose();
                  }}
                />

                <SheetRow
                  icon={Workflow}
                  title="Connect tools"
                  onClick={() => {
                    onToolAction('tasks');
                    onClose();
                  }}
                />

                <SheetRow
                  icon={Target}
                  title="Find priorities"
                  onClick={() => {
                    onAiAction('find-priorities');
                    onClose();
                  }}
                />

                <SheetRow
                  icon={Sparkles}
                  title="Plan my day"
                  onClick={() => {
                    onAiAction('summarize-day');
                    onClose();
                  }}
                />

                <SheetRow
                  icon={Search}
                  title="Deep research"
                  onClick={() => {
                    onAiAction('deep-research');
                    onClose();
                  }}
                />

                <SheetRow
                  icon={Globe}
                  title="Live web search"
                  onClick={() => {
                    onAiAction('live-search');
                    onClose();
                  }}
                />

                <SheetRow
                  icon={PiggyBank}
                  title="Money leak scan"
                  badge="Kivo Pro"
                  onClick={() => {
                    onToolAction('money-saver');
                    onClose();
                  }}
                />

                <SheetRow
                  icon={Brain}
                  title="Memory search"
                  onClick={() => {
                    onToolAction('tasks');
                    onClose();
                  }}
                />

                <SheetRow
                  icon={Zap}
                  title="Automation builder"
                  badge="Pro"
                  onClick={() => {
                    onToolAction('tasks');
                    onClose();
                  }}
                />

                <SheetRow
                  icon={BotMessageSquare}
                  title="Chat mode"
                  onClick={() => {
                    onToolAction('tasks');
                    onClose();
                  }}
                />

                <SheetRow
                  icon={CalendarClock}
                  title="Scheduled tasks"
                  onClick={() => {
                    onToolAction('calendar');
                    onClose();
                  }}
                />

                <SheetRow
                  icon={Mic}
                  title={isListening ? 'Voice input on' : 'Voice input'}
                  onClick={() => {
                    onVoiceInput();
                    onClose();
                  }}
                />
              </section>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function MiniPhotoPlaceholder({
  icon: Icon,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="flex h-[112px] w-[112px] shrink-0 items-center justify-center rounded-[22px] bg-[#f7f7f7] text-[#c6c6c6]">
      <Icon className="h-7 w-7" strokeWidth={1.9} />
    </div>
  );
}

function SheetRow({ icon: Icon, title, badge, onClick }: SheetRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[64px] w-full items-center gap-6 rounded-[18px] text-left transition active:scale-[0.99]"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#2f2f2f]">
        <Icon className="h-[27px] w-[27px]" strokeWidth={2.1} />
      </span>

      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span className="truncate text-[22px] font-normal tracking-[-0.035em] text-[#303030]">
          {title}
        </span>

        {badge ? (
          <span className="shrink-0 rounded-full bg-[#fff5d8] px-3 py-1 text-[14px] font-medium tracking-[-0.02em] text-[#d79b00]">
            {badge}
          </span>
        ) : null}
      </span>
    </button>
  );
}
