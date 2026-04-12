'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CircleUserRound,
  Crown,
  Menu,
  Mic,
  Plus,
  Send,
  Settings,
  Speech,
  SquareCheckBig,
  MessageSquare,
  Plug,
  LogOut,
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

export default function ChatPage() {
  const router = useRouter();
  const createConversation = useAppStore((s) => s.createConversation);
  const openConversation = useAppStore((s) => s.openConversation);
  const conversationList = useAppStore((s) => s.conversationList);
  const activeConversationId = useAppStore((s) => s.activeConversationId);
  const draftPrompt = useAppStore((s) => s.draftPrompt);
  const setDraftPrompt = useAppStore((s) => s.setDraftPrompt);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const logout = useAppStore((s) => s.logout);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const hasText = draftPrompt.trim().length > 0;
  const activeConversation = useMemo(
    () => conversationList.find((conversation) => conversation.id === activeConversationId),
    [conversationList, activeConversationId],
  );

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const runNotice = (title: string, detail: string) => setNotice({ title, detail });

  const handleSend = async () => {
    if (!hasText || isSending) return;
    setIsSending(true);
    try {
      await sendMessage(draftPrompt.trim());
      setDraftPrompt('');
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
      runNotice('Speech unavailable', 'Could not capture microphone input.');
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    return recognition;
  };

  const toggleMic = () => {
    if (typeof window === 'undefined') return;
    const recognition = ensureSpeechRecognition();
    if (!recognition) {
      runNotice('Speech unavailable', 'This browser does not support speech recognition.');
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
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      runNotice('Voice unavailable', 'Text-to-speech is not available here.');
      return;
    }

    const text = hasText ? draftPrompt.trim() : 'What can I do for you?';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    runNotice('Voice utility', 'Reading current text aloud.');
  };

  const createNewChat = () => {
    const conversationId = createConversation();
    openConversation(conversationId);
    setDraftPrompt('');
    setMenuOpen(false);
    runNotice('New chat', 'Started a fresh conversation.');
  };

  const openConversations = () => {
    setMenuOpen(false);
    router.push('/history');
  };

  const openAddActions = () => runNotice('Add actions', 'Create, attach, or start a task from here.');
  const openConnectors = () => runNotice('Connectors', 'Open tools and connectors options.');

  const openMenuLink = (href: string) => {
    setMenuOpen(false);
    router.push(href);
  };

  const onSignOut = () => {
    logout();
    setMenuOpen(false);
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-[#eff0f4] px-3 pb-4 pt-2 text-[#353b45] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] w-full max-w-md flex-col overflow-hidden rounded-[42px] border border-[#dfe2e8] bg-[#eceef2] shadow-[0_22px_40px_rgba(34,42,58,0.14)]">
        <header className="flex h-[78px] items-center justify-between border-b border-[#dde0e6] px-5">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#4b525e] transition hover:bg-[#e5e8ee]"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-[44px] font-medium leading-none tracking-[-0.03em] text-[#39404b]" style={{ fontSize: '2.8rem' }}>Kivo</h1>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#cfd4dc] bg-[#eceef3] text-[#616874]"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <section className="relative flex flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center px-8">
            <p className="text-center text-[62px] font-medium leading-[1.1] tracking-[-0.02em] text-[#3d434f]" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>
              What can I do for you?
            </p>
          </div>

          <AnimatePresence>
            {menuOpen ? (
              <>
                <motion.button
                  type="button"
                  className="absolute inset-0 z-10 bg-[#8f96a61f]"
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  aria-label="Close menu"
                />
                <motion.aside
                  initial={{ y: 36, opacity: 0.4 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 48, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-x-3 bottom-3 z-20 rounded-[32px] border border-[#d8dce4] bg-[#ebedf2] p-4 shadow-[0_10px_28px_rgba(39,48,64,0.16)]"
                >
                  <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-[#cfd4dc]" />
                  <h2 className="mb-3 px-1 text-4xl font-medium text-[#4e5561]">Menu</h2>

                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-3xl border border-[#d9dde5] bg-[#f2f3f7]">
                      {primaryMenu.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => {
                              if (item.action === 'new-chat') createNewChat();
                              if (item.action === 'conversations') openConversations();
                              if (item.href) openMenuLink(item.href);
                            }}
                            className="flex w-full items-center gap-3 border-b border-[#e0e3e8] px-4 py-3 text-left last:border-b-0"
                          >
                            <Icon className="h-5 w-5 text-[#757d89]" />
                            <span className="flex-1 text-3xl text-[#4d5460]">{item.label}</span>
                            <ChevronRight className="h-5 w-5 text-[#a1a8b3]" />
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      <p className="mb-2 px-3 text-2xl text-[#757c88]">Secondary</p>
                      <div className="overflow-hidden rounded-3xl border border-[#d9dde5] bg-[#f2f3f7]">
                        {secondaryMenu.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => openMenuLink(item.href)}
                              className="flex w-full items-center gap-3 border-b border-[#e0e3e8] px-4 py-3 text-left last:border-b-0"
                            >
                              <Icon className="h-5 w-5 text-[#757d89]" />
                              <span className="flex-1 text-3xl text-[#4d5460]">{item.label}</span>
                              {item.badge ? (
                                <span className="rounded-full bg-[#e0e4ea] px-2 py-0.5 text-sm text-[#7a818c]">{item.badge}</span>
                              ) : null}
                              <ChevronRight className="h-5 w-5 text-[#a1a8b3]" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-[#d9dde5] bg-[#f2f3f7]">
                      <button
                        type="button"
                        onClick={onSignOut}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left"
                      >
                        <LogOut className="h-5 w-5 text-[#757d89]" />
                        <span className="flex-1 text-3xl text-[#4d5460]">Sign Out</span>
                        <ChevronRight className="h-5 w-5 text-[#a1a8b3]" />
                      </button>
                    </div>
                  </div>
                </motion.aside>
              </>
            ) : null}
          </AnimatePresence>

          <div className="px-3 pb-[calc(14px+env(safe-area-inset-bottom))]">
            <div className="rounded-[30px] border border-[#d9dde4] bg-[#f4f5f8] px-5 pb-4 pt-3 shadow-[0_10px_20px_rgba(56,65,83,0.12)]">
              <label htmlFor="kivo-composer" className="sr-only">
                Assign a task or ask anything
              </label>
              <input
                id="kivo-composer"
                value={draftPrompt}
                onChange={(event) => setDraftPrompt(event.target.value)}
                placeholder="Assign a task or ask anything"
                className="mb-4 w-full bg-transparent text-[16px] text-[#757d8b] placeholder:text-[#8a91a0] outline-none"
              />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openAddActions}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#cfd4dd] bg-[#eceff4] text-[#7b8391]"
                    aria-label="Add"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={openConnectors}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#cfd4dd] bg-[#eceff4] text-[#7b8391]"
                    aria-label="Connectors"
                  >
                    <Plug className="h-5 w-5" />
                  </button>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleVoiceUtility}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#cfd4dd] bg-[#eceff4] text-[#7b8391]"
                    aria-label="Voice utility"
                  >
                    <Speech className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#cfd4dd] text-[#7b8391] ${listening ? 'bg-[#dfe5ee]' : 'bg-[#eceff4]'}`}
                    aria-label="Microphone"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!hasText || isSending}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#cfd4dd] bg-[#e6e9ef] text-[#9198a4] disabled:opacity-60"
                    aria-label="Send message"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {notice ? (
        <div className="pointer-events-none fixed left-1/2 top-5 z-50 w-[min(92vw,360px)] -translate-x-1/2 rounded-2xl border border-[#d7dce4] bg-[#f4f6f9] px-4 py-2 text-center shadow-md">
          <p className="text-sm font-medium text-[#4e5662]">{notice.title}</p>
          <p className="text-xs text-[#757d8b]">{notice.detail}</p>
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {activeConversation ? `Active conversation ${activeConversation.title}` : 'No conversation selected'}
      </div>
    </main>
  );
}
