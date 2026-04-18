'use client';

import { useEffect, useMemo, type ComponentType, type ReactNode } from 'react';
import { AnimatePresence, motion, type PanInfo, useDragControls } from 'framer-motion';
import {
  CalendarClock,
  Camera,
  ChevronRight,
  FileText,
  Globe,
  Link2,
  Mail,
  Mic,
  PiggyBank,
  Sparkles,
  Target,
  Telescope,
  Wallet,
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

type ActionRowProps = {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
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
    if (info.offset.y > 120 || info.velocity.y > 650) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close action sheet"
            className="fixed inset-0 z-40 bg-[#101828]/24 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[34px] border border-[#e8edf4] bg-[rgba(252,253,255,0.98)] shadow-[0_-20px_52px_rgba(15,23,42,0.14)] backdrop-blur-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.16 }}
            onDragEnd={handleDragEnd}
          >
            <div className="sticky top-0 z-10 border-b border-[#edf1f6] bg-[rgba(252,253,255,0.94)] px-4 pb-3 pt-2 backdrop-blur-xl sm:px-5">
              <button
                type="button"
                onPointerDown={(event) => dragControls.start(event)}
                aria-label="Drag to dismiss"
                className="mx-auto mb-3 block w-full touch-none"
              >
                <span className="mx-auto block h-1.5 w-14 rounded-full bg-[#d8deea]" />
              </button>

              <h2 className="text-[21px] font-semibold tracking-[-0.03em] text-[#111827]">
                Add to chat
              </h2>
              <p className="mt-0.5 text-[13px] text-[#667085]">
                Photos, files, and useful Kivo actions
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(22px,env(safe-area-inset-bottom))] pt-4 sm:px-5">
              <div className="space-y-5">
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8a94a6]">
                      Media
                    </h3>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => {
                        onAddImages();
                        onClose();
                      }}
                      className="flex h-[124px] w-[124px] shrink-0 flex-col items-center justify-center rounded-[24px] border border-[#e3e9f2] bg-[linear-gradient(180deg,#ffffff_0%,#f7faff_100%)] text-[#5a667a] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition active:scale-[0.985]"
                    >
                      <Camera className="h-8 w-8" strokeWidth={1.9} />
                      <span className="mt-3 text-[14px] font-medium">Add image</span>
                    </button>

                    {imagePreviews.map((image) => (
                      <div
                        key={image.id}
                        className="h-[124px] w-[124px] shrink-0 overflow-hidden rounded-[24px] border border-[#e3e9f2] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.05)]"
                      >
                        <img
                          src={image.previewUrl}
                          alt={image.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}

                    <MiniMediaCard
                      icon={FileText}
                      title="Files"
                      onClick={() => {
                        onAddFiles();
                        onClose();
                      }}
                    />
                    <MiniMediaCard
                      icon={Link2}
                      title="Link"
                      onClick={() => {
                        onPasteLink();
                        onClose();
                      }}
                    />
                    <MiniMediaCard
                      icon={Mic}
                      title={isListening ? 'Voice on' : 'Voice'}
                      active={isListening}
                      onClick={() => {
                        onVoiceInput();
                        onClose();
                      }}
                    />
                  </div>
                </section>

                <Divider />

                <section className="space-y-1">
                  <ActionRow
                    icon={Sparkles}
                    title="Summarize my day"
                    subtitle="Turn everything into a clear plan"
                    onClick={() => {
                      onAiAction('summarize-day');
                      onClose();
                    }}
                  />
                  <ActionRow
                    icon={Target}
                    title="Find priorities"
                    subtitle="See what matters most now"
                    onClick={() => {
                      onAiAction('find-priorities');
                      onClose();
                    }}
                  />
                  <ActionRow
                    icon={Telescope}
                    title="Deep research"
                    subtitle="Investigate something thoroughly"
                    onClick={() => {
                      onAiAction('deep-research');
                      onClose();
                    }}
                  />
                  <ActionRow
                    icon={Globe}
                    title="Live search"
                    subtitle="Get current web information"
                    onClick={() => {
                      onAiAction('live-search');
                      onClose();
                    }}
                  />
                </section>

                <Divider />

                <section className="space-y-1 pb-1">
                  <ActionRow
                    icon={Mail}
                    title="Gmail"
                    subtitle={toolState.gmail.subtitle}
                    badge={toolState.gmail.connected ? 'Connected' : 'Connect'}
                    onClick={() => {
                      onToolAction('gmail');
                      onClose();
                    }}
                  />
                  <ActionRow
                    icon={CalendarClock}
                    title="Calendar"
                    subtitle={toolState.calendar.subtitle}
                    badge={toolState.calendar.connected ? 'Connected' : 'Connect'}
                    onClick={() => {
                      onToolAction('calendar');
                      onClose();
                    }}
                  />
                  <ActionRow
                    icon={PiggyBank}
                    title="Money Saver"
                    subtitle={toolState['money-saver'].subtitle}
                    badge={toolState['money-saver'].connected ? 'Ready' : 'Open'}
                    onClick={() => {
                      onToolAction('money-saver');
                      onClose();
                    }}
                  />
                  <ActionRow
                    icon={Wallet}
                    title="Tasks"
                    subtitle={toolState.tasks.subtitle}
                    badge={toolState.tasks.connected ? 'Ready' : 'Open'}
                    onClick={() => {
                      onToolAction('tasks');
                      onClose();
                    }}
                  />
                </section>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Divider() {
  return <div className="h-px bg-[#eceff4]" />;
}

function MiniMediaCard({
  icon: Icon,
  title,
  onClick,
  active = false,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[124px] w-[92px] shrink-0 flex-col items-center justify-center rounded-[22px] border shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition active:scale-[0.985] ${
        active
          ? 'border-[#cfe0fa] bg-[#eef5ff] text-[#44648d]'
          : 'border-[#e3e9f2] bg-white text-[#667085]'
      }`}
    >
      <Icon className="h-6 w-6" strokeWidth={1.9} />
      <span className="mt-3 text-[13px] font-medium">{title}</span>
    </button>
  );
}

function ActionRow({
  icon: Icon,
  title,
  subtitle,
  badge,
  onClick,
}: ActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[68px] w-full items-center gap-3 rounded-[18px] px-1 py-3 text-left transition hover:bg-[#fafbfc] active:scale-[0.995]"
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#f7f9fc] text-[#475467]">
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold tracking-[-0.02em] text-[#111827]">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-[#667085]">
          {subtitle}
        </span>
      </span>

      {badge ? (
        <span className="inline-flex h-7 shrink-0 items-center rounded-full border border-[#dfe5ee] bg-[#f8fafc] px-2.5 text-[11px] font-semibold text-[#5e6c84]">
          {badge}
        </span>
      ) : null}

      <ChevronRight
        className="h-[18px] w-[18px] shrink-0 text-[#98a2b3]"
        strokeWidth={2}
      />
    </button>
  );
}
