'use client';

import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  AnimatePresence,
  motion,
  Reorder,
  type PanInfo,
  useDragControls,
} from 'framer-motion';
import {
  BotMessageSquare,
  Brain,
  CalendarClock,
  Camera,
  Check,
  FileText,
  Globe,
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

type PhotoPreviewItem = {
  id: string;
  name: string;
  previewUrl: string;
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
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [orderedPhotoIds, setOrderedPhotoIds] = useState<string[]>([]);

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

  const imagePreviews = useMemo<PhotoPreviewItem[]>(
    () =>
      attachments
        .filter((item) => item.kind === 'image' && item.previewUrl)
        .map((item) => ({ id: item.id, name: item.name, previewUrl: item.previewUrl || '' })),
    [attachments],
  );

  const photoPreviewItems = useMemo<PhotoPreviewItem[]>(
    () => (imagePreviews.length > 0 ? imagePreviews : DEFAULT_PHOTO_PREVIEWS),
    [imagePreviews],
  );

  useEffect(() => {
    setOrderedPhotoIds((current) => {
      const visibleIds = photoPreviewItems.map((item) => item.id);
      const preserved = current.filter((id) => visibleIds.includes(id));
      const missing = visibleIds.filter((id) => !preserved.includes(id));
      return [...preserved, ...missing];
    });
  }, [photoPreviewItems]);

  const orderedPhotoItems = useMemo(
    () =>
      orderedPhotoIds
        .map((id) => photoPreviewItems.find((item) => item.id === id))
        .filter((item): item is PhotoPreviewItem => Boolean(item)),
    [orderedPhotoIds, photoPreviewItems],
  );

  const selectedCount = selectedPhotoIds.length;

  const closeAfter = (action: () => void) => {
    haptic.selection();
    action();
    onClose();
  };

  const togglePhotoSelection = (id: string) => {
    haptic.selection();
    setSelectedPhotoIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const handleCameraCapture = () => {
    closeAfter(onAddImages);
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
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={closeWithHaptic}
          />

          <motion.aside
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[72dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[34px] border border-white/70 bg-white/88 shadow-[0_-24px_70px_rgba(0,0,0,0.18)] backdrop-blur-2xl"
            initial={{ y: '100%', scale: 0.985 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: '100%', scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 520, damping: 42, mass: 0.78 }}
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
                  <div>
                    <h2 className="text-[30px] font-semibold tracking-[-0.045em] text-[#222]">
                      Photos
                    </h2>
                    {selectedCount > 0 ? (
                      <p className="mt-1 text-[14px] font-medium tracking-[-0.02em] text-black/45">
                        {selectedCount} selected · hold and drag to reorder
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => closeAfter(onAddImages)}
                    className="text-[24px] font-semibold tracking-[-0.025em] text-[#0a84ff] active:opacity-60"
                  >
                    See all
                  </button>
                </div>

                <Reorder.Group
                  axis="x"
                  values={orderedPhotoIds}
                  onReorder={setOrderedPhotoIds}
                  className="-mx-1 flex snap-x gap-5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <button
                    type="button"
                    onClick={handleCameraCapture}
                    className="relative flex h-[124px] w-[124px] shrink-0 snap-start flex-col items-center justify-center overflow-hidden rounded-[28px] bg-[#f2f2f2] text-[#2b2b2b] transition active:scale-[0.985]"
                  >
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.95),transparent_60%)]" />
                    <Camera className="relative h-9 w-9" strokeWidth={2.25} />
                    <span className="relative mt-4 text-[20px] font-normal tracking-[-0.025em]">
                      Camera
                    </span>
                  </button>

                  {orderedPhotoItems.map((image) => {
                    const selectedIndex = selectedPhotoIds.indexOf(image.id);
                    const selected = selectedIndex !== -1;

                    return (
                      <Reorder.Item
                        key={image.id}
                        value={image.id}
                        as="button"
                        type="button"
                        whileDrag={{ scale: 1.045, zIndex: 20 }}
                        onClick={() => togglePhotoSelection(image.id)}
                        className="relative h-[124px] w-[124px] shrink-0 snap-start overflow-hidden rounded-[28px] bg-[#f2f2f2] ring-1 ring-black/[0.04] transition active:scale-[0.985]"
                      >
                        <img
                          src={image.previewUrl}
                          alt={image.name}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/12" />
                        <span
                          className={`absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border-[4px] border-white/95 shadow-[0_2px_10px_rgba(0,0,0,0.14)] transition ${
                            selected ? 'bg-[#0a84ff] text-white' : 'bg-white/28 text-transparent backdrop-blur-md'
                          }`}
                        >
                          {selected ? (
                            selectedCount > 1 ? (
                              <span className="text-[13px] font-bold leading-none">{selectedIndex + 1}</span>
                            ) : (
                              <Check className="h-4 w-4" strokeWidth={3} />
                            )
                          ) : null}
                        </span>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
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

const DEFAULT_PHOTO_PREVIEWS: PhotoPreviewItem[] = [
  {
    id: 'default-photo-preview-1',
    name: 'Kivo screen preview',
    previewUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="34" fill="%23f5f5f5"/><rect x="28" y="54" width="184" height="132" rx="26" fill="white"/><rect x="82" y="72" width="76" height="8" rx="4" fill="%23cfcfcf"/><text x="54" y="111" font-family="Arial" font-size="15" font-weight="700" fill="%23282828">Photos</text><rect x="54" y="130" width="38" height="38" rx="10" fill="%23eeeeee"/><rect x="101" y="130" width="38" height="38" rx="10" fill="%23f1f1f1"/><rect x="148" y="130" width="38" height="38" rx="10" fill="%23f1f1f1"/><circle cx="190" cy="52" r="18" fill="%23ffffff" fill-opacity="0.65" stroke="%23ffffff" stroke-width="4"/></svg>',
  },
  {
    id: 'default-photo-preview-2',
    name: 'Kivo response preview',
    previewUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="34" fill="%23f7f7f7"/><text x="24" y="42" font-family="Arial" font-size="13" fill="%23808080">Tarkistaminen on tärkeää...</text><text x="24" y="70" font-family="Arial" font-size="13" fill="%23808080">Seuraava toimi on tarkistaa</text><text x="24" y="98" font-family="Arial" font-size="13" fill="%23808080">kalenterisi ja varmistaa...</text><rect x="30" y="170" width="180" height="42" rx="18" fill="white"/><circle cx="52" cy="191" r="11" fill="%23efefef"/><rect x="76" y="184" width="88" height="8" rx="4" fill="%23888888"/><circle cx="190" cy="52" r="18" fill="%23ffffff" fill-opacity="0.65" stroke="%23ffffff" stroke-width="4"/></svg>',
  },
  {
    id: 'default-photo-preview-3',
    name: 'Kivo task preview',
    previewUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="34" fill="%23f6f6f6"/><text x="25" y="38" font-family="Arial" font-size="12" fill="%23808080">suosittelen, että tarkistat...</text><text x="25" y="62" font-family="Arial" font-size="12" fill="%23808080">tärkeimmät tapahtumat...</text><rect x="24" y="104" width="192" height="76" rx="20" fill="white"/><rect x="48" y="128" width="38" height="38" rx="12" fill="%23eeeeee"/><text x="100" y="137" font-family="Arial" font-size="14" font-weight="700" fill="%23282828">Task Progress 4/4</text><circle cx="104" cy="156" r="5" fill="%2334c759"/><rect x="116" y="151" width="88" height="8" rx="4" fill="%23888888"/><rect x="24" y="195" width="192" height="28" rx="14" fill="white"/><circle cx="190" cy="52" r="18" fill="%23ffffff" fill-opacity="0.65" stroke="%23ffffff" stroke-width="4"/></svg>',
  },
];

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
