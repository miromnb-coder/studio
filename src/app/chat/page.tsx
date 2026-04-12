'use client';

import { useEffect, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CircleUserRound,
  Crown,
  LogOut,
  Menu,
  MessageSquare,
  Mic,
  Plus,
  Send,
  Settings,
  Speech,
  SquareCheckBig,
  Wrench,
  Workflow,
  Link2,
  ClipboardPlus,
  FilePlus2,
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
  { label: 'Settings', icon: Settings, href: '/settings' },
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
      setDraftPrompt(`${draftPrompt ? `${draftPrompt} ` : ''}${transcript}`.trim());
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
    setMenuOpen(false);
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
    <main className="min-h-screen bg-[#eeedf2] px-3 py-3 text-[#3e4450] sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[410px] flex-col overflow-hidden rounded-[40px] border border-[#dde0e6] bg-[#e8e9ee] shadow-[0_20px_38px_rgba(54,61,78,0.16)]">
        <div className="flex h-12 items-center justify-between px-8 text-[34px] font-medium tracking-[-0.01em] text-[#383e49]">
          <span>21:04</span>
          <span className="text-base">◔◔▭</span>
        </div>

        <header className="flex h-[74px] items-center justify-between border-b border-[#d8dce2] px-5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#4f5662] transition hover:bg-[#e1e5ea]"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
          </button>

          <h1 className="text-[49px] font-medium leading-none tracking-[-0.03em] text-[#454c58]">Kivo</h1>

          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setCreateOpen(false);
              setConnectorsOpen(false);
            }}
            aria-label="Open menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#cbd0d9] bg-[#e6e8ed] text-[#6d7481]"
          >
            <Menu className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </header>

        <div className="relative flex flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center px-10 pb-24">
            <p
              className="text-center text-[59px] font-normal leading-[1.12] tracking-[-0.01em] text-[#3f4652]"
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
                  className="absolute inset-0 z-20 bg-[#949baa26]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMenuOpen(false)}
                />

                <motion.aside
                  initial={{ y: 34, opacity: 0.55 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 42, opacity: 0 }}
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                  className="absolute inset-x-0 bottom-0 z-30 rounded-t-[34px] border-t border-[#d8dce3] bg-[#e9ebf0] px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(34,41,56,0.12)]"
                >
                  <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-[#cfd3db]" />
                  <h2 className="mb-3 px-2 text-[44px] font-medium text-[#505764]">Menu</h2>

                  <MenuGroup
                    rows={primaryMenu}
                    onClick={(row) => {
                      if (row.action === 'new-chat') createNewChat();
                      if (row.action === 'conversations') onConversations();
                      if (row.href) onMenuRoute(row.href);
                    }}
                  />

                  <p className="mb-2 mt-4 px-2 text-[38px] text-[#787f8c]">Secondary</p>
                  <MenuGroup rows={secondaryMenu} onClick={(row) => row.href && onMenuRoute(row.href)} />

                  <div className="mt-4 overflow-hidden rounded-[18px] border border-[#d4d8df] bg-[#f1f2f6] shadow-[0_8px_18px_rgba(52,60,74,0.08)]">
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="flex h-[62px] w-full items-center gap-3 px-4 text-left"
                    >
                      <LogOut className="h-5 w-5 text-[#757d8a]" strokeWidth={1.8} />
                      <span className="flex-1 text-[38px] text-[#545b67]">Sign Out</span>
                      <ChevronRight className="h-5 w-5 text-[#9da4b1]" strokeWidth={1.8} />
                    </button>
                  </div>
                </motion.aside>
              </>
            ) : null}
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-10">
            <div className="pointer-events-auto rounded-[34px] border border-[#d5d9e1] bg-[#eff1f5] px-4 pb-3 pt-3 shadow-[0_8px_20px_rgba(55,63,79,0.13)]">
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
                className="mb-3 w-full bg-transparent px-1 text-[13px] text-[#7a8190] placeholder:text-[#8e95a2] outline-none"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SmallIconButton
                    label="Add actions"
                    onClick={() => {
                      setCreateOpen(true);
                      setConnectorsOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    <Plus className="h-[18px] w-[18px]" strokeWidth={1.9} />
                  </SmallIconButton>
                  <SmallIconButton
                    label="Open connectors"
                    onClick={() => {
                      setConnectorsOpen(true);
                      setCreateOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    <Wrench className="h-[18px] w-[18px]" strokeWidth={1.9} />
                  </SmallIconButton>
                </div>

                <div className="flex items-center gap-2">
                  <SmallIconButton label="Voice utility" onClick={handleVoiceUtility}>
                    <Speech className="h-[18px] w-[18px]" strokeWidth={1.9} />
                  </SmallIconButton>

                  <SmallIconButton label="Microphone" onClick={toggleMic} active={listening}>
                    <Mic className="h-[18px] w-[18px]" strokeWidth={1.9} />
                  </SmallIconButton>

                  <SmallIconButton label="Send" onClick={() => void handleSend()} disabled={!hasText || isSending}>
                    <Send className="h-[18px] w-[18px]" strokeWidth={1.9} />
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

        <div className="mx-auto mb-2 mt-auto h-1.5 w-24 rounded-full bg-[#0f1217]/45" />
      </section>

      <AnimatePresence>
        {notice ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="pointer-events-none fixed left-1/2 top-5 z-50 w-[min(92vw,340px)] -translate-x-1/2 rounded-2xl border border-[#d7dce4] bg-[#f4f6f9] px-4 py-2 text-center shadow-md"
          >
            <p className="text-sm font-medium text-[#4e5662]">{notice.title}</p>
            <p className="text-xs text-[#757d8b]">{notice.detail}</p>
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
  rows: Array<{ label: string; icon: ComponentType<{ className?: string; strokeWidth?: number }>; href?: string; action?: string }>;
  onClick: (row: { label: string; href?: string; action?: string }) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[#d4d8df] bg-[#f1f2f6] shadow-[0_8px_18px_rgba(52,60,74,0.08)]">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <button
            key={row.label}
            type="button"
            onClick={() => onClick(row)}
            className="flex h-[62px] w-full items-center gap-3 border-b border-[#e2e5ea] px-4 text-left last:border-b-0"
          >
            <Icon className="h-5 w-5 text-[#757d8a]" strokeWidth={1.8} />
            <span className="flex-1 text-[38px] text-[#545b67]">{row.label}</span>
            <ChevronRight className="h-5 w-5 text-[#9da4b1]" strokeWidth={1.8} />
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
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ccd1da] text-[#7a818f] transition ${
        active ? 'bg-[#dfe4ec]' : 'bg-[#e8ebf0]'
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
            className="absolute inset-0 z-20 bg-[#9198a722]"
            aria-label={`Close ${title}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            initial={{ y: 30, opacity: 0.55 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 38, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
            className="absolute inset-x-3 bottom-[calc(98px+env(safe-area-inset-bottom))] z-30 rounded-[24px] border border-[#d4d8df] bg-[#f1f2f6] p-3 shadow-[0_10px_24px_rgba(40,46,59,0.14)]"
          >
            <p className="mb-2 px-1 text-sm font-medium text-[#616875]">{title}</p>
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onSelect(item.label)}
                  className="flex h-11 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-[#e7eaf0]"
                >
                  <Icon className="h-[18px] w-[18px] text-[#757d8a]" strokeWidth={1.9} />
                  <span className="text-sm text-[#525966]">{item.label}</span>
                </button>
              );
            })}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
