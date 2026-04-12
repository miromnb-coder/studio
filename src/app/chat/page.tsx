'use client';

import { useEffect, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CircleUserRound,
  ClipboardPlus,
  Crown,
  FilePlus2,
  Link2,
  LogOut,
  Menu,
  MessageSquare,
  Mic,
  Plus,
  Send,
  Settings,
  Speech,
  SquareCheckBig,
  Workflow,
  Wrench,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../store/app-store';

type ActionNotice = { title: string; detail: string };

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    SpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const primaryMenu = [
  { label: 'New Chat', icon: MessageSquare, action: 'new-chat' as const },
  { label: 'Conversations', icon: MessageSquare, action: 'conversations' as const },
  { label: 'Tasks', icon: SquareCheckBig, href: '/tasks' },
  { label: 'Alerts', icon: Bell, href: '/alerts' },
];

const secondaryMenu = [
  { label: 'Profile', icon: CircleUserRound, href: '/profile' },
  { label: 'Settings', icon: Settings, href: '/settings', badge: 'New' },
  { label: 'Upgrade', icon: Crown, href: '/upgrade' },
];

const createActions = [
  { label: 'Create Task', icon: ClipboardPlus },
  { label: 'New Note', icon: FilePlus2 },
];

const connectorActions = [
  { label: 'Tools Hub', icon: Wrench },
  { label: 'Connectors', icon: Link2 },
  { label: 'Workflows', icon: Workflow },
];

export default function ChatPage() {
  const router = useRouter();

  const createConversation = useAppStore((s) => s.createConversation);
  const openConversation = useAppStore((s) => s.openConversation);
  const draftPrompt = useAppStore((s) => s.draftPrompt);
  const setDraftPrompt = useAppStore((s) => s.setDraftPrompt);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const logout = useAppStore((s) => s.logout);

  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hasText = draftPrompt.trim().length > 0;

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const showNotice = (title: string, detail: string) => setNotice({ title, detail });

  const closeAllSheets = () => {
    setMenuOpen(false);
    setCreateOpen(false);
    setConnectorsOpen(false);
  };

  const onBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/chat');
  };

  const handleSend = async () => {
    if (!hasText || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(draftPrompt.trim());
      setDraftPrompt('');
      showNotice('Sent', 'Message added to conversation.');
    } finally {
      setIsSending(false);
    }
  };

  const ensureSpeechRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return null;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) return;
      const nextValue = draftPrompt ? `${draftPrompt} ${transcript}` : transcript;
      setDraftPrompt(nextValue.trim());
    };
    recognition.onerror = () => {
      setListening(false);
      showNotice('Speech unavailable', 'Microphone input could not be captured.');
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    return recognition;
  };

  const toggleMic = () => {
    const recognition = ensureSpeechRecognition();
    if (!recognition) {
      showNotice('Speech unavailable', 'This browser does not support speech recognition.');
      return;
    }

    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }

    setListening(true);
    recognition.start();
  };

  const handleVoiceUtility = () => {
    if (!window.speechSynthesis) {
      showNotice('Voice unavailable', 'Text-to-speech is not available in this browser.');
      return;
    }

    const text = hasText ? draftPrompt.trim() : 'What can I do for you?';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    showNotice('Voice utility', 'Assistant voice utility started.');
  };

  const createNewChat = () => {
    const conversationId = createConversation();
    openConversation(conversationId);
    setDraftPrompt('');
    closeAllSheets();
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onMenuRoute = (href: string) => {
    closeAllSheets();
    router.push(href);
  };

  const onConversations = () => {
    closeAllSheets();
    router.push('/history');
  };

  const onSignOut = () => {
    logout();
    closeAllSheets();
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-[#efeff2] px-3 py-3 text-[#4b5260] sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-[430px] flex-col overflow-hidden rounded-[34px] border border-[#dfe2e8] bg-[#ececf1] shadow-[0_18px_38px_rgba(82,88,104,0.11)]">
        <header className="flex h-[72px] items-center justify-between border-b border-[#d9dde4] px-5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full text-[#68707d] transition hover:bg-[#e7e9ee]"
          >
            <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={1.9} />
          </button>

          <h1 className="text-[23px] font-medium tracking-[-0.03em] text-[#4c5361]">Kivo</h1>

          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setCreateOpen(false);
              setConnectorsOpen(false);
            }}
            aria-label="Open menu"
            className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#d0d5dd] bg-[#eceef2] text-[#767e8b] shadow-[0_2px_6px_rgba(67,74,88,0.03)]"
          >
            <Menu className="h-[20px] w-[20px]" strokeWidth={1.8} />
          </button>
        </header>

        <div className="relative flex flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center px-8 pb-[168px] pt-8">
            <p
              className="max-w-[310px] text-center text-[18px] font-normal leading-[1.18] tracking-[-0.015em] text-[#474d5a]"
              style={{ fontFamily: 'ui-serif, Georgia, Times, serif' }}
            >
              What can I do for you?
            </p>
          </div>

          <AnimatePresence>
            {menuOpen ? (
              <>
                <motion.button
                  type="button"
                  aria-label="Close menu"
                  className="absolute inset-0 z-20 bg-[#8f97a610]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMenuOpen(false)}
                />

                <motion.aside
                  initial={{ y: 22, opacity: 0.8 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 24, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="absolute inset-x-0 bottom-0 z-30 rounded-t-[30px] border-t border-[#d9dde4] bg-[#ececf1] px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_26px_rgba(66,72,88,0.08)]"
                >
                  <div className="mx-auto mb-4 h-[5px] w-14 rounded-full bg-[#d1d5dc]" />
                  <h2 className="mb-3 px-2 text-[18px] font-medium tracking-[-0.02em] text-[#5b6270]">Menu</h2>

                  <MenuGroup
                    rows={primaryMenu}
                    onClick={(row) => {
                      if (row.action === 'new-chat') createNewChat();
                      if (row.action === 'conversations') onConversations();
                      if (row.href) onMenuRoute(row.href);
                    }}
                  />

                  <p className="mb-2 mt-5 px-2 text-[13px] font-normal text-[#8b919f]">Secondary</p>
                  <MenuGroup rows={secondaryMenu} onClick={(row) => row.href && onMenuRoute(row.href)} />

                  <div className="mt-5 overflow-hidden rounded-[18px] border border-[#d7dbe2] bg-[#f4f5f8] shadow-[0_6px_14px_rgba(66,72,88,0.05)]">
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="flex h-[56px] w-full items-center gap-3 px-4 text-left"
                    >
                      <LogOut className="h-5 w-5 text-[#7d8492]" strokeWidth={1.8} />
                      <span className="flex-1 text-[16px] font-normal text-[#59606d]">Sign Out</span>
                      <ChevronRight className="h-5 w-5 text-[#a3a9b5]" strokeWidth={1.8} />
                    </button>
                  </div>
                </motion.aside>
              </>
            ) : null}
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-x-5 bottom-[calc(20px+env(safe-area-inset-bottom))] z-10">
            <div className="pointer-events-auto rounded-[28px] border border-[#d9dde4] bg-[#f3f4f7] px-4 pb-4 pt-4 shadow-[0_14px_22px_rgba(70,76,90,0.07)]">
              <label htmlFor="chat-composer" className="sr-only">
                Assign a task or ask anything
              </label>

              <input
                ref={inputRef}
                id="chat-composer"
                value={draftPrompt}
                onChange={(event) => setDraftPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Assign a task or ask anything"
                className="mb-4 w-full bg-transparent px-1 text-[16px] font-normal text-[#7d8592] placeholder:text-[#9ea4b0] outline-none"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SmallIconButton
                    label="Add actions"
                    onClick={() => {
                      setCreateOpen(true);
                      setConnectorsOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    <Plus className="h-[22px] w-[22px]" strokeWidth={1.8} />
                  </SmallIconButton>

                  <SmallIconButton
                    label="Open connectors"
                    onClick={() => {
                      setConnectorsOpen(true);
                      setCreateOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    <Wrench className="h-[20px] w-[20px]" strokeWidth={1.8} />
                  </SmallIconButton>
                </div>

                <div className="flex items-center gap-3">
                  <SmallIconButton label="Voice utility" onClick={handleVoiceUtility}>
                    <Speech className="h-[20px] w-[20px]" strokeWidth={1.8} />
                  </SmallIconButton>

                  <SmallIconButton label="Microphone" onClick={toggleMic} active={listening}>
                    <Mic className="h-[20px] w-[20px]" strokeWidth={1.8} />
                  </SmallIconButton>

                  <SmallIconButton
                    label="Send"
                    onClick={() => void handleSend()}
                    disabled={!hasText || isSending}
                  >
                    <Send className="h-[20px] w-[20px]" strokeWidth={1.8} />
                  </SmallIconButton>
                </div>
              </div>
            </div>
          </div>

          <BottomMiniSheet
            open={createOpen}
            title="Create"
            items={createActions}
            onClose={() => setCreateOpen(false)}
            onSelect={(label) => {
              setCreateOpen(false);
              showNotice(label, 'Create action opened.');
            }}
          />

          <BottomMiniSheet
            open={connectorsOpen}
            title="Tools & Connectors"
            items={connectorActions}
            onClose={() => setConnectorsOpen(false)}
            onSelect={(label) => {
              setConnectorsOpen(false);
              showNotice(label, 'Connectors UI opened.');
            }}
          />
        </div>

        <div className="mx-auto mb-3 mt-auto h-1.5 w-[110px] rounded-full bg-[#14181f]/38" />
      </section>

      <AnimatePresence>
        {notice ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="pointer-events-none fixed left-1/2 top-5 z-50 w-[min(92vw,340px)] -translate-x-1/2 rounded-2xl border border-[#d8dde5] bg-[#f6f7fa] px-4 py-2 text-center shadow-[0_6px_16px_rgba(70,76,90,0.07)]"
          >
            <p className="text-sm font-medium text-[#505865]">{notice.title}</p>
            <p className="text-xs text-[#7d8593]">{notice.detail}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function MenuGroup({
  rows,
  onClick,
}: {
  rows: Array<{
    label: string;
    icon: ComponentType<{ className?: string; strokeWidth?: number }>;
    href?: string;
    action?: string;
    badge?: string;
  }>;
  onClick: (row: { label: string; href?: string; action?: string }) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[#d7dbe2] bg-[#f4f5f8] shadow-[0_6px_14px_rgba(66,72,88,0.05)]">
      {rows.map((row) => {
        const Icon = row.icon;

        return (
          <button
            key={row.label}
            type="button"
            onClick={() => onClick(row)}
            className="flex h-[56px] w-full items-center gap-3 border-b border-[#e2e5eb] px-4 text-left last:border-b-0"
          >
            <Icon className="h-5 w-5 text-[#7d8492]" strokeWidth={1.8} />
            <span className="flex-1 text-[16px] font-normal text-[#59606d]">{row.label}</span>

            {row.badge ? (
              <span className="rounded-full bg-[#e7e9ee] px-2 py-0.5 text-[11px] font-medium text-[#9097a4]">
                {row.badge}
              </span>
            ) : null}

            <ChevronRight className="h-5 w-5 text-[#a3a9b5]" strokeWidth={1.8} />
          </button>
        );
      })}
    </div>
  );
}

function SmallIconButton({
  children,
  label,
  onClick,
  disabled,
  active,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={`inline-flex h-[50px] w-[50px] items-center justify-center rounded-full border border-[#d2d6de] text-[#848b98] transition ${
        active ? 'bg-[#e4e7ed]' : 'bg-[#eef0f4]'
      } disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

function BottomMiniSheet({
  open,
  title,
  items,
  onClose,
  onSelect,
}: {
  open: boolean;
  title: string;
  items: Array<{ label: string; icon: ComponentType<{ className?: string; strokeWidth?: number }> }>;
  onClose: () => void;
  onSelect: (label: string) => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="absolute inset-0 z-20 bg-[#8f97a610]"
            aria-label={`Close ${title}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            initial={{ y: 24, opacity: 0.82 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 26, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-x-4 bottom-[calc(116px+env(safe-area-inset-bottom))] z-30 rounded-[24px] border border-[#d7dbe2] bg-[#f4f5f8] p-3 shadow-[0_12px_24px_rgba(66,72,88,0.08)]"
          >
            <p className="mb-2 px-1 text-[14px] font-medium text-[#636a77]">{title}</p>

            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onSelect(item.label)}
                  className="flex h-11 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-[#eaedf2]"
                >
                  <Icon className="h-[18px] w-[18px] text-[#7d8492]" strokeWidth={1.9} />
                  <span className="text-sm text-[#575e6b]">{item.label}</span>
                </button>
              );
            })}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
