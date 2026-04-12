'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardPlus, FilePlus2, Link2, Workflow, Wrench } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../store/app-store';
import { AppShell } from '@/components/chat/AppShell';
import { BottomActionSheet } from '@/components/chat/BottomActionSheet';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { Composer } from '@/components/chat/Composer';
import { MessageThread } from '@/components/chat/MessageThread';
import { MenuSheet } from '@/components/chat/MenuSheet';
import { sharedPrimaryMenu, sharedSecondaryMenu } from '@/components/chat/menu-config';

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

  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const messages = useAppStore((s) => s.messages);
  const streamError = useAppStore((s) => s.streamError);
  const isAgentResponding = useAppStore((s) => s.isAgentResponding);

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
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

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

    if (!user?.id) {
      showNotice('Sign in required', 'Please sign in before sending messages.');
      router.push('/login?next=/chat');
      return;
    }

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
    <AppShell>
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <ChatHeader
          onBack={onBack}
          onToggleMenu={() => {
            setMenuOpen((v) => !v);
            setCreateOpen(false);
            setConnectorsOpen(false);
          }}
        />

        <div className="relative flex flex-1 flex-col">
          <MessageThread messages={messages} pending={isAgentResponding} />

          <MenuSheet
            open={menuOpen}
            primaryRows={sharedPrimaryMenu}
            secondaryRows={sharedSecondaryMenu}
            onClose={() => setMenuOpen(false)}
            onPrimaryClick={(row) => {
              if (row.action === 'new-chat') createNewChat();
              if (row.action === 'conversations') onConversations();
              if (row.href) onMenuRoute(row.href);
            }}
            onSecondaryClick={(row) => row.href && onMenuRoute(row.href)}
            onSignOut={onSignOut}
          />

          <Composer
            value={draftPrompt}
            isSending={isSending}
            listening={listening}
            onChange={setDraftPrompt}
            onSend={() => void handleSend()}
            onOpenCreate={() => {
              setCreateOpen(true);
              setConnectorsOpen(false);
              setMenuOpen(false);
            }}
            onOpenConnectors={() => {
              setConnectorsOpen(true);
              setCreateOpen(false);
              setMenuOpen(false);
            }}
            onVoiceUtility={handleVoiceUtility}
            onToggleMic={toggleMic}
            inputRef={inputRef}
          />

          <BottomActionSheet
            open={createOpen}
            title="Create"
            items={createActions}
            onClose={() => setCreateOpen(false)}
            onSelect={(label) => {
              setCreateOpen(false);
              showNotice(label, 'Create action opened.');
            }}
          />

          <BottomActionSheet
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
      </div>

      <AnimatePresence>
        {notice || streamError ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="pointer-events-none fixed left-1/2 top-5 z-50 w-[min(92vw,340px)] -translate-x-1/2 rounded-2xl border border-[#d8dde5] bg-[#f6f7fa] px-4 py-2 text-center shadow-[0_6px_16px_rgba(70,76,90,0.07)]"
          >
            <p className="text-sm font-medium text-[#505865]">{notice?.title ?? 'Message issue'}</p>
            <p className="text-xs text-[#7d8593]">{notice?.detail ?? streamError}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AppShell>
  );
}
