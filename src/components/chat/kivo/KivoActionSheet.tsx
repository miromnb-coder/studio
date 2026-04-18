'use client';

import { useEffect, useMemo } from 'react';
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

type AiActionId = 'summarize-day' | 'find-priorities' | 'deep-research' | 'live-search';
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
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
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
    if (!open) return;

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

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 650) onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close action sheet"
            className="fixed inset-0 z-40 bg-[#0f172a]/25 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[34px] border border-[#e6ebf3] bg-[rgba(250,252,255,0.96)] shadow-[0_-22px_52px_rgba(15,23,42,0.17)] backdrop-blur-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.18 }}
            onDragEnd={handleDragEnd}
          >
            <header className="sticky top-0 z-10 border-b border-[#e7edf5] bg-[rgba(250,252,255,0.92)] px-4 pb-3 pt-2 backdrop-blur-xl sm:px-5">
              <button
                type="button"
                onPointerDown={(event) => dragControls.start(event)}
                className="mx-auto mb-2 block w-full touch-none"
                aria-label="Drag to dismiss"
              >
                <span className="mx-auto block h-1.5 w-14 rounded-full bg-[#d5dceb]" />
              </button>

              <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#111827]">Kivo Action Sheet</h2>
              <p className="text-[13px] text-[#667085]">Attach media, run AI actions, and open daily tools.</p>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-[max(22px,env(safe-area-inset-bottom))] pt-4 sm:px-5">
              <Section title="Media & Attachments" subtitle="Start with photos, files, links, or voice.">
                <button
                  type="button"
                  onClick={() => {
                    onAddImages();
                    onClose();
                  }}
                  className="w-full rounded-2xl border border-[#dfe8f5] bg-[linear-gradient(140deg,#ffffff_0%,#f3f8ff_100%)] p-4 text-left shadow-[0_10px_22px_rgba(18,34,66,0.08)] transition hover:brightness-[0.99] active:scale-[0.995]"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#d7e4f8] bg-white text-[#46679a]">
                      <Camera className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span>
                      <span className="block text-[17px] font-semibold tracking-[-0.02em] text-[#111827]">Add image</span>
                      <span className="mt-0.5 block text-[13px] text-[#5f6f85]">Photo library · Camera · Screenshots</span>
                    </span>
                  </div>
                </button>

                {imagePreviews.length ? (
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {imagePreviews.map((image) => (
                      <div
                        key={image.id}
                        className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#dee5f1] bg-white"
                      >
                        <img src={image.previewUrl} alt={image.name} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <SecondaryAction
                    icon={FileText}
                    title="Add files"
                    onClick={() => {
                      onAddFiles();
                      onClose();
                    }}
                  />
                  <SecondaryAction
                    icon={Link2}
                    title="Paste link"
                    onClick={() => {
                      onPasteLink();
                      onClose();
                    }}
                  />
                  <SecondaryAction
                    icon={Mic}
                    title={isListening ? 'Stop voice' : 'Voice input'}
                    onClick={() => {
                      onVoiceInput();
                      onClose();
                    }}
                    active={isListening}
                  />
                </div>
              </Section>

              <Section title="AI Actions" subtitle="One-tap prompts that keep work moving.">
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
              </Section>

              <Section title="Connected Tools" subtitle="Your daily productivity stack in one place.">
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
              </Section>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5 rounded-[24px] border border-[#e6ebf4] bg-white/90 p-3.5 shadow-[0_8px_20px_rgba(16,24,40,0.06)]">
      <div className="px-1">
        <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#111827]">{title}</h3>
        <p className="text-[12px] text-[#667085]">{subtitle}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SecondaryAction({
  icon: Icon,
  title,
  onClick,
  active = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[52px] items-center gap-2 rounded-xl border px-3 text-left transition active:scale-[0.99] ${
        active
          ? 'border-[#cbddf8] bg-[#edf5ff] text-[#385985]'
          : 'border-[#e3eaf4] bg-white text-[#475467] hover:bg-[#f8fafc]'
      }`}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      <span className="text-[13px] font-medium">{title}</span>
    </button>
  );
}

function ActionRow({ icon: Icon, title, subtitle, badge, onClick }: ActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[62px] w-full items-center gap-3 rounded-xl border border-[#e7edf5] bg-white px-3.5 py-3 text-left transition hover:bg-[#fbfcfe] active:scale-[0.996]"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dfe7f3] bg-[#f7faff] text-[#516581]">
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold tracking-[-0.01em] text-[#111827]">{title}</span>
        <span className="mt-0.5 block truncate text-[12px] text-[#667085]">{subtitle}</span>
      </span>

      {badge ? (
        <span className="inline-flex h-7 shrink-0 items-center rounded-full border border-[#dce3ef] bg-[#f8faff] px-2.5 text-[11px] font-semibold text-[#50607a]">
          {badge}
        </span>
      ) : null}

      <ChevronRight className="h-[18px] w-[18px] shrink-0 text-[#98a2b3]" strokeWidth={2} />
    </button>
  );
}
