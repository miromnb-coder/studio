'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChevronRight,
  FolderOpen,
  History,
  ImagePlus,
  MessageSquarePlus,
  Mic,
  ShieldCheck,
  SquareCheckBig,
  Wrench,
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

type QuickActionItem = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  const primaryActions: QuickActionItem[] = [
    {
      id: 'new-chat',
      label: 'New Chat',
      icon: MessageSquarePlus,
      onClick: onNewChat,
    },
    {
      id: 'upload-file',
      label: 'Upload File',
      icon: FolderOpen,
      onClick: onOpenFiles,
    },
    {
      id: 'upload-image',
      label: 'Upload Image',
      icon: ImagePlus,
      onClick: onOpenImages,
    },
    {
      id: 'voice-input',
      label: 'Voice Input',
      icon: Mic,
      onClick: onToggleMic,
    },
  ];

  const navigationItems: QuickActionItem[] = [
    {
      id: 'conversations',
      label: 'Conversations',
      icon: History,
      href: '/history',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: SquareCheckBig,
      href: '/tasks',
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: Bell,
      href: '/alerts',
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: Wrench,
      href: '/tools',
    },
    {
      id: 'upgrade',
      label: 'Upgrade',
      icon: ShieldCheck,
      href: '/upgrade',
    },
  ];

  const handleItemPress = (item: QuickActionItem) => {
    if (item.onClick) {
      item.onClick();
      onClose();
      return;
    }

    if (item.href) {
      onNavigate(item.href);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close quick actions"
            className="fixed inset-0 z-40 bg-black/[0.10] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[560px] rounded-t-[34px] border border-black/[0.05] bg-[rgba(245,245,247,0.96)] px-4 pb-[calc(22px+env(safe-area-inset-bottom))] pt-4 shadow-[0_-20px_50px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:px-5"
            initial={{ y: 44, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 36, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.95 }}
          >
            <div className="mx-auto mb-4 h-[5px] w-14 rounded-full bg-black/[0.10]" />

            <div className="px-2">
              <h2 className="text-[18px] font-medium tracking-[-0.03em] text-[#3a404a]">
                Quick actions
              </h2>
            </div>

            <QuickSection className="mt-4">
              {primaryActions.map((item) => (
                <QuickRow
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  onClick={() => handleItemPress(item)}
                />
              ))}
            </QuickSection>

            <QuickSectionTitle className="mt-5">Go to</QuickSectionTitle>

            <QuickSection className="mt-2">
              {navigationItems.map((item) => (
                <QuickRow
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  onClick={() => handleItemPress(item)}
                />
              ))}
            </QuickSection>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function QuickSection({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[22px] border border-black/[0.05] bg-[rgba(255,255,255,0.72)] shadow-[0_10px_24px_rgba(15,23,42,0.05)] backdrop-blur-xl ${className}`}
    >
      {children}
    </section>
  );
}

function QuickSectionTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`px-2 text-[13px] font-normal tracking-[-0.01em] text-[#8a909c] ${className}`}>
      {children}
    </p>
  );
}

function QuickRow({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[58px] w-full items-center gap-3 border-b border-black/[0.05] px-4 text-left transition-all duration-200 ease-out last:border-b-0 hover:bg-black/[0.02] active:scale-[0.995]"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.05] bg-white/70 text-[#6f7785]">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </span>

      <span className="flex-1 text-[16px] font-normal tracking-[-0.02em] text-[#4b5563]">
        {label}
      </span>

      <ChevronRight className="h-5 w-5 text-[#a2a8b3]" strokeWidth={1.8} />
    </button>
  );
}
