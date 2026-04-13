'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlarmClockPlus, ClipboardImage, ClipboardPlus, FilePlus2, MessageSquarePlus, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../store/app-store';
import type { MessageAttachment } from '../store/app-store';
import { AppShell } from '@/components/chat/AppShell';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { Composer } from '@/components/chat/Composer';
import { MessageThread } from '@/components/chat/MessageThread';
import { QuickCreateMenu } from '@/components/chat/QuickCreateMenu';
import { WorkspaceSheet } from '@/components/chat/WorkspaceSheet';

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
  { id: 'new-chat', label: 'New Chat', icon: MessageSquarePlus },
  { id: 'new-task', label: 'New Task', icon: ClipboardPlus },
  { id: 'new-note', label: 'New Note', icon: FilePlus2 },
  { id: 'upload-file', label: 'Upload File', icon: Upload },
  { id: 'paste-screenshot', label: 'Paste Screenshot', icon: ClipboardImage },
  { id: 'reminder', label: 'Reminder', icon: AlarmClockPlus },
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

  const [createOpen, setCreateOpen] = useState(false);
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [listening, setListening] = useState(false);
  const [composerAttachments, setComposerAttachments] = useState<MessageAttachment[]>([]);
  const [filePickerAccept, setFilePickerAccept] = useState<string>('');

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hasText = draftPrompt.trim().length > 0;

  useEffect(
    () => () => {
      composerAttachments.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      });
    },
    [composerAttachments],
  );

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
    if ((!hasText && composerAttachments.length === 0) || isSending) return;

    if (!user?.id) {
      showNotice('Sign in required', 'Please sign in before sending messages.');
      router.push('/login?next=/chat');
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(draftPrompt.trim(), { attachments: composerAttachments });
      setDraftPrompt('');
      composerAttachments.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      });
      setComposerAttachments([]);
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

  const createNewChat = () => {
    const conversationId = createConversation();
    openConversation(conversationId);
    setDraftPrompt('');
    setComposerAttachments((prev) => {
      prev.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      });
      return [];
    });
    closeAllSheets();
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const toAttachment = (file: File): MessageAttachment => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    kind: file.type.startsWith('image/') ? 'image' : 'file',
    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
  });

  const addAttachments = (files: FileList | File[]) => {
    const nextAttachments = Array.from(files).map(toAttachment);
    if (nextAttachments.length === 0) return;
    setComposerAttachments((prev) => [...prev, ...nextAttachments]);
    showNotice(
      'Attachment added',
      nextAttachments.length === 1 ? `${nextAttachments[0].name} is ready to send.` : `${nextAttachments.length} files are ready to send.`,
    );
  };

  const removeAttachment = (attachmentId: string) => {
    setComposerAttachments((prev) => {
      const target = prev.find((attachment) => attachment.id === attachmentId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((attachment) => attachment.id !== attachmentId);
    });
  };


  const closeAndFocusComposer = () => {
    setConnectorsOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const openRouteFromSheet = (href: string) => {
    setConnectorsOpen(false);
    router.push(href);
  };

  const openFilePicker = (accept = '') => {
    setFilePickerAccept(accept);
    fileInputRef.current?.click();
  };

  const tryPasteScreenshot = async () => {
    const hasClipboardRead = typeof navigator !== 'undefined' && 'clipboard' in navigator && 'read' in navigator.clipboard;

    if (!hasClipboardRead) {
      openFilePicker('image/*');
      showNotice('Paste not supported', 'Clipboard image access is unavailable in this browser. Opened file picker instead.');
      return;
    }

    try {
      const clipboardItems = await navigator.clipboard.read();
      const imageItem = clipboardItems.find((item) => item.types.some((type) => type.startsWith('image/')));

      if (!imageItem) {
        openFilePicker('image/*');
        showNotice('No screenshot found', 'Clipboard did not include an image. Opened file picker instead.');
        return;
      }

      const imageType = imageItem.types.find((type) => type.startsWith('image/')) ?? 'image/png';
      const blob = await imageItem.getType(imageType);
      const extension = imageType.split('/')[1] || 'png';
      const file = new File([blob], `screenshot-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`, { type: imageType });
      addAttachments([file]);
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch {
      openFilePicker();
      showNotice('Clipboard blocked', 'Could not read clipboard image. Opened file picker instead.');
    }
  };

  return (
    <AppShell>
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <ChatHeader onBack={onBack} />

        <div className="relative flex flex-1 flex-col">
          <MessageThread messages={messages} pending={isAgentResponding} />


          <Composer
            value={draftPrompt}
            isSending={isSending}
            listening={listening}
            createOpen={createOpen}
            attachments={composerAttachments}
            onChange={setDraftPrompt}
            onSend={() => void handleSend()}
            onOpenCreate={() => {
              setCreateOpen((prev) => !prev);
              setConnectorsOpen(false);
            }}
            onOpenTools={() => {
              setConnectorsOpen(true);
              setCreateOpen(false);
            }}
            onToggleMic={toggleMic}
            onRemoveAttachment={removeAttachment}
            inputRef={inputRef}
          />

          <QuickCreateMenu
            open={createOpen}
            items={createActions}
            onClose={() => setCreateOpen(false)}
            onSelect={(id) => void (async () => {
              setCreateOpen(false);
              if (id === 'new-chat') {
                createNewChat();
                return;
              }
              if (id === 'new-task') {
                router.push('/tasks');
                return;
              }
              if (id === 'new-note') {
                router.push('/notes');
                return;
              }
              if (id === 'upload-file') {
                openFilePicker();
                return;
              }
              if (id === 'paste-screenshot') {
                await tryPasteScreenshot();
                return;
              }
              if (id === 'reminder') {
                router.push('/alerts');
              }
            })()}
          />

          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            accept={filePickerAccept}
            multiple
            onChange={(event) => {
              if (event.target.files?.length) addAttachments(event.target.files);
              event.target.value = '';
              setFilePickerAccept('');
            }}
          />

          <WorkspaceSheet
            open={connectorsOpen}
            onClose={() => setConnectorsOpen(false)}
            onQuickAction={(id) => {
              if (id === 'ask-agent') {
                closeAndFocusComposer();
                return;
              }
              if (id === 'analyze') {
                openRouteFromSheet('/analyze');
                return;
              }
              if (id === 'planner') {
                openRouteFromSheet('/actions?type=planner');
                return;
              }
              openRouteFromSheet('/money-saver');
            }}
            onConnectorAction={(connector, mode) => {
              if (connector === 'gmail') {
                openRouteFromSheet('/settings');
                return;
              }
              if (connector === 'google-calendar' || connector === 'google-drive' || connector === 'outlook') {
                openRouteFromSheet('/settings');
                return;
              }
              if (connector === 'browser' && mode === 'connect') {
                openRouteFromSheet('/tools');
                return;
              }
              showNotice('Connector updated', `${connector.replace('-', ' ')} is now ${mode === 'toggle' ? 'toggled' : 'ready'}.`);
            }}
            onToolSelect={(id) => {
              if (id === 'finance-scanner') {
                openRouteFromSheet('/money');
                return;
              }
              if (id === 'memory-search') {
                openRouteFromSheet('/memory');
                return;
              }
              if (id === 'research-mode') {
                openRouteFromSheet('/agents');
                return;
              }
              if (id === 'compare-tool') {
                openRouteFromSheet('/actions');
                return;
              }
              openRouteFromSheet('/tools');
            }}
            onRecentSelect={(id) => {
              if (id === 'gmail-sync') {
                openRouteFromSheet('/settings');
                return;
              }
              if (id === 'subscription-scan') {
                openRouteFromSheet('/money-saver');
                return;
              }
              openRouteFromSheet('/actions?type=planner');
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
