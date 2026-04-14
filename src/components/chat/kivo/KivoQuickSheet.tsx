'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FolderOpen,
  History,
  ImagePlus,
  MessageSquarePlus,
  Mic,
  Settings2,
  ShieldCheck,
  Bell,
  SquareCheckBig,
  Wrench,
  ChevronRight,
} from 'lucide-react';

type KivoQuickSheetProps = {
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onOpenFiles: () => void;
  onOpenImages: () => void;
  onToggleMic: () => void;
  onNavigate: (href: string) => void;
};

export function KivoQuickSheet({
  open,
  onClose,
  onNewChat,
  onOpenFiles,
  onOpenImages,
  onToggleMic,
  onNavigate,
}: KivoQuickSheetProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const primary = [
    { id: 'new-chat', label: 'New Chat', icon: MessageSquarePlus, onClick: onNewChat },
    { id: 'upload-file', label: 'Upload File', icon: FolderOpen, onClick: onOpenFiles },
    { id: 'upload-image', label: 'Upload Image', icon: ImagePlus, onClick: onOpenImages },
    { id: 'voice', label: 'Voice Input', icon: Mic, onClick: onToggleMic },
  ];

  const navigation = [
    { id: 'history', label: 'Conversations', icon: History, href: '/history' },
    { id: 'tasks', label: 'Tasks', icon: SquareCheckBig, href: '/tasks' },
    { id: 'alerts', label: 'Alerts', icon: Bell, href: '/alerts' },
    { id: 'tools', label: 'Tools', icon: Wrench, href: '/tools' },
    { id: 'control', label: 'Control', icon: Settings2, href: '/control' },
    { id: 'upgrade', label: 'Upgrade', icon: ShieldCheck, href: '/upgrade' },
  ];

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close quick actions"
            className="fixed inset-0 z-40 bg-[#7f87940f]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            initial={{ y: 54, opacity: 0.92 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 34, mass: 0.95 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[560px] rounded-t-[32px] border-t border-[#d9dde4] bg-[#ececf1] px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-5 shadow-[0_-14px_30px_rgba(66,72,88,0.1)] sm:px-6"
          >
            <div className="mx-auto mb-5 h-[5px] w-14 rounded-full bg-[#d1d5dc]" />
            <h2 className="mb-3 px-2 text-[18px] font-medium tracking-[-0.02em] text-[#5b6270]">
              Quick actions
            </h2>

            <QuickSection>
              {primary.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      item.onClick();
                      onClose();
                    }}
                    className="tap-feedback flex h-[56px] w-full items-center gap-3 border-b border-[#e2e5eb] px-4 text-left transition-colors last:border-b-0 hover:bg-[#eceff4]"
                  >
                    <Icon className="h-5 w-5 text-[#7d8492]" strokeWidth={1.8} />
                    <span className="flex-1 text-[16px] font-normal text-[#59606d]">{item.label}</span>
                    <ChevronRight className="h-5 w-5 text-[#a3a9b5]" strokeWidth={1.8} />
                  </button>
                );
              })}
            </QuickSection>

            <QuickSection title="Go to">
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onNavigate(item.href);
                      onClose();
                    }}
                    className="tap-feedback flex h-[56px] w-full items-center gap-3 border-b border-[#e2e5eb] px-4 text-left transition-colors last:border-b-0 hover:bg-[#eceff4]"
                  >
                    <Icon className="h-5 w-5 text-[#7d8492]" strokeWidth={1.8} />
                    <span className="flex-1 text-[16px] font-normal text-[#59606d]">{item.label}</span>
                    <ChevronRight className="h-5 w-5 text-[#a3a9b5]" strokeWidth={1.8} />
                  </button>
                );
              })}
            </QuickSection>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function QuickSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 first:mt-0">
      {title ? <p className="mb-2 mt-5 px-2 text-[13px] font-normal text-[#8b919f]">{title}</p> : null}
      <div className="overflow-hidden rounded-[18px] border border-[#d7dbe2] bg-[#f5f6f9] shadow-[0_8px_16px_rgba(66,72,88,0.05)]">
        {children}
      </div>
    </section>
  );
}
