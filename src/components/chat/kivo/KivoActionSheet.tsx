'use client';

import { useCallback, useEffect, useMemo, type ComponentType } from 'react';
import {
  AnimatePresence,
  motion,
  type PanInfo,
  useDragControls,
} from 'framer-motion';
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
import { haptic } from '@/lib/haptics';

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
  const closeWithHaptic = useCallback(() => {
    haptic.selection();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    haptic.light();

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeWithHaptic();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeWithHaptic, open]);

  const imagePreviews = useMemo(
    () => attachments.filter((item) => item.kind === 'image' && item.previewUrl),
    [attachments],
  );

  const closeAfter = (action: () => void) => {
    haptic.selection();
    action();
    onClose();
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.y > 70 || info.velocity.y > 420) {
      closeWithHaptic();
    } else {
      haptic.light();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close action sheet"
            className="fixed inset-0 z-40 bg-black/28 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            onClick={closeWithHaptic}
          />

          <motion.aside
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[68dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-18px_48px_rgba(0,0,0,0.16)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 560, damping: 44, mass: 0.75 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.12 }}
            onDragEnd={handleDragEnd}
          >
            <button
              type="button"
              onPointerDown={(event) => dragControls.start(event)}
              aria-label="Drag to dismiss"
              className="shrink-0 touch-none cursor-grab px-4 pb-5 pt-4 active:cursor-grabbing"
            >
              <span className="mx-auto block h-1.5 w-[72px] rounded-full bg-black/20" />
            </button>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-[calc(env(safe-area-inset-bottom,0px)+96px)] [-webkit-overflow-scrolling:touch]">
              <section className="border-b border-black/[0.08] pb-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[24px] font-semibold tracking-[-0.035em] text-[#222]">
                    Photos
                  </h2>

                  <button
                    type="button"
                    onClick={() => closeAfter(onAddImages)}
                    className="text-[19px] font-semibold tracking-[-0.02em] text-[#0a84ff] active:opacity-60"
                  >
                    See all
                  </button>
                </div>

                <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => closeAfter(onAddImages)}
                    className="flex h-[112px] w-[112px] shrink-0 flex-col items-center justify-center rounded-[22px] bg-[#f2f2f2] text-[#2b2b2b] transition active:scale-[0.985]"
                  >
                    <Camera className="h-8 w-8" strokeWidth={2.2} />
                    <span className="mt-3 text-[18px] font-normal tracking-[-0.02em]">
                      Camera
                    </span>
                  </button>

                  {imagePreviews.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => closeAfter(onAddImages)}
                      className="h-[112px] w-[112px] shrink-0 overflow-hidden rounded-[22px] bg-[#f2f2f2]"
                    >
                      <img
                        src={image.previewUrl}
                        alt={image.name}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}

                  <MiniPhotoButton
                    icon={FileText}
                    label="Files"
                    onClick={() => closeAfter(onAddFiles)}
                  />

                  <MiniPhotoButton
                    icon={Link2}
                    label="Link"
                    onClick={() => closeAfter(onPasteLink)}
                  />
                </div>
              </section>

              <section className="pt-4">
                <SheetRow icon={FileText} title="Add files" onClick={() => closeAfter(onAddFiles)} />
                <SheetRow icon={Mail} title={toolState.gmail.connected ? 'Open Gmail' : 'Connect Gmail'} onClick={() => closeAfter(() => onToolAction('gmail'))} />
                <SheetRow icon={CalendarClock} title={toolState.calendar.connected ? 'Open Calendar' : 'Connect Calendar'} onClick={() => closeAfter(() => onToolAction('calendar'))} />
                <SheetRow icon={Workflow} title="Connect tools" onClick={() => closeAfter(() => onToolAction('tasks'))} />
                <SheetRow icon={Target} title="Find priorities" onClick={() => closeAfter(() => onAiAction('find-priorities'))} />
                <SheetRow icon={Sparkles} title="Plan my day" onClick={() => closeAfter(() => onAiAction('summarize-day'))} />
                <SheetRow icon={Search} title="Deep research" onClick={() => closeAfter(() => onAiAction('deep-research'))} />
                <SheetRow icon={Globe} title="Live web search" onClick={() => closeAfter(() => onAiAction('live-search'))} />
                <SheetRow icon={PiggyBank} title="Money leak scan" badge="Kivo Pro" onClick={() => closeAfter(() => onToolAction('money-saver'))} />
                <SheetRow icon={Brain} title="Memory search" onClick={() => closeAfter(() => onToolAction('tasks'))} />
                <SheetRow icon={Zap} title="Automation builder" badge="Pro" onClick={() => closeAfter(() => onToolAction('tasks'))} />
                <SheetRow icon={BotMessageSquare} title="Chat mode" onClick={() => closeAfter(() => onToolAction('tasks'))} />
                <SheetRow icon={CalendarClock} title="Scheduled tasks" onClick={() => closeAfter(() => onToolAction('calendar'))} />
                <SheetRow icon={Mic} title={isListening ? 'Voice input on' : 'Voice input'} onClick={() => closeAfter(onVoiceInput)} />
              </section>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function MiniPhotoButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[112px] w-[112px] shrink-0 flex-col items-center justify-center rounded-[22px] bg-[#f7f7f7] text-[#bdbdbd] transition active:scale-[0.985]"
    >
      <Icon className="h-7 w-7" strokeWidth={1.9} />
      <span className="mt-3 text-[16px] tracking-[-0.02em]">{label}</span>
    </button>
  );
}

function SheetRow({ icon: Icon, title, badge, onClick }: SheetRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[58px] w-full items-center gap-5 rounded-[18px] text-left transition active:scale-[0.99] active:bg-black/[0.025]"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#2f2f2f]">
        <Icon className="h-[26px] w-[26px]" strokeWidth={2.05} />
      </span>

      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span className="truncate text-[20px] font-normal tracking-[-0.035em] text-[#303030]">
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
