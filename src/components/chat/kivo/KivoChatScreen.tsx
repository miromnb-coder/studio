'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AlertCircle, Paperclip, X } from 'lucide-react';
import { useAppStore } from '@/app/store/app-store';
import type { MessageAttachment } from '@/app/store/app-store';
import { MessageThread } from '@/components/chat/MessageThread';
import { KivoChatHeader } from './KivoChatHeader';
import { KivoComposerDock } from './KivoComposerDock';
import { KivoQuickSheet } from './KivoQuickSheet';

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

type Notice = {
  title: string;
  detail: string;
};

export function KivoChatScreen() {
  const router = useRouter();
  const pathname = usePathname();

  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const messages = useAppStore((s) => s.messages);
  const draftPrompt = useAppStore((s) => s.draftPrompt);
  const setDraftPrompt = useAppStore((s) => s.setDraftPrompt);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const createConversation = useAppStore((s) => s.createConversation);
  const openConversation = useAppStore((s) => s.openConversation);
  const isAgentResponding = useAppStore((s) => s.isAgentResponding);
  const streamError = useAppStore((s) => s.streamError);

  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [filePickerAccept, setFilePickerAccept] = useState('');
  const [quickSheetOpen, setQuickSheetOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const noticeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    return () => {
      attachments.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
    };
  }, [attachments]);

  useEffect(() => {
    setQuickSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current);
      noticeTimeoutRef.current = null;
    }

    if (!notice) return;

    noticeTimeoutRef.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimeoutRef.current = null;
    }, 2400);

    return () => {
      if (noticeTimeoutRef.current) {
        window.clearTimeout(noticeTimeoutRef.current);
        noticeTimeoutRef.current = null;
      }
    };
  }, [notice]);

  const hasMessages = messages.length > 0;
  const canSend = draftPrompt.trim().length > 0 || attachments.length > 0;

  const placeholder = useMemo(() => {
    if (attachments.length > 0 && !draftPrompt.trim()) {
      return 'Add a message or send attachments';
    }

    return 'Assign a task or ask anything';
  }, [attachments.length, draftPrompt]);

  const showNotice = (title: string, detail: string) => {
    setNotice({ title, detail });
  };

  const cleanupAttachments = (items: MessageAttachment[]) => {
    items.forEach((attachment) => {
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    });
  };

  const focusComposer = () => {
    requestAnimationFrame(() => {
      const textarea = document.getElementById(
        'kivo-composer-textarea',
      ) as HTMLTextAreaElement | null;
      textarea?.focus();
    });
  };

  const createNewChat = () => {
    const conversationId = createConversation();
    openConversation(conversationId);
    cleanupAttachments(attachments);
    setAttachments([]);
    setDraftPrompt('');
    setQuickSheetOpen(false);
    router.push('/chat');
    focusComposer();
  };

  const toAttachment = (file: File): MessageAttachment => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    kind: file.type.startsWith('image/') ? 'image' : 'file',
    previewUrl: file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : undefined,
  });

  const addAttachments = (files: FileList | File[]) => {
    const next = Array.from(files).map(toAttachment);

    if (!next.length) return;

    setAttachments((prev) => [...prev, ...next]);

    showNotice(
      'Attachment added',
      next.length === 1
        ? `${next[0].name} is ready to send.`
        : `${next.length} files are ready to send.`,
    );
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === attachmentId);

      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return prev.filter((item) => item.id !== attachmentId);
    });
  };

  const openFilePicker = (accept = '') => {
    setFilePickerAccept(accept);
    fileInputRef.current?.click();
  };

  const ensureSpeechRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;

    const SpeechRecognitionCtor =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionCtor) return null;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();

      if (!transcript) return;

      const currentDraft =
        typeof useAppStore.getState === 'function'
          ? useAppStore.getState().draftPrompt
          : draftPrompt;

      setDraftPrompt(currentDraft ? `${currentDraft} ${transcript}` : transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      showNotice('Speech unavailable', 'Microphone input could not be captured.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return recognition;
  };

  const toggleMic = () => {
    const recognition = ensureSpeechRecognition();

    if (!recognition) {
      showNotice(
        'Speech unavailable',
        'This browser does not support speech recognition.',
      );
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    recognition.start();
  };

  const handleSend = async () => {
    if (!canSend || isSending || isAgentResponding) return;

    if (!user?.id) {
      showNotice('Sign in required', 'Please sign in before sending messages.');
      router.push('/login?next=/chat');
      return;
    }

    setIsSending(true);

    try {
      await sendMessage(draftPrompt.trim(), { attachments });
      setDraftPrompt('');
      cleanupAttachments(attachments);
      setAttachments([]);
      setQuickSheetOpen(false);
      focusComposer();
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickNavigate = (href: string) => {
    setQuickSheetOpen(false);
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#2f3640]">
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.92),rgba(245,245,247,1)_58%)] shadow-[0_24px_80px_rgba(31,41,55,0.08)]">
        <KivoChatHeader onOpenQuickSheet={() => setQuickSheetOpen(true)} />

        <main className="relative flex min-h-0 flex-1 flex-col">
          {streamError ? (
            <div className="px-6 pt-4">
              <div className="flex items-start gap-2 rounded-[18px] border border-[#edd5d5] bg-[#fff6f6] px-4 py-3 text-sm text-[#8b4a4a] shadow-[0_8px_20px_rgba(127,29,29,0.05)]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{streamError}</span>
              </div>
            </div>
          ) : null}

          {!hasMessages ? (
            <div className="flex min-h-0 flex-1 items-start justify-center px-8 pb-[240px] pt-[18vh]">
              <h2
                className="max-w-[340px] text-center text-[34px] font-normal leading-[1.08] tracking-[-0.05em] text-[#353b45] sm:text-[40px]"
                style={{ fontFamily: 'ui-serif, Georgia, Times, serif' }}
              >
                What can I do for you?
              </h2>
            </div>
          ) : (
            <div className="min-h-0 flex-1 pb-[158px]">
              <MessageThread messages={messages} pending={isAgentResponding || isSending} />
            </div>
          )}
        </main>

        {attachments.length > 0 ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-[124px] z-20 mx-auto w-full max-w-[560px] px-6">
            <div className="pointer-events-auto mx-auto flex max-w-[470px] flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="inline-flex items-center gap-2 rounded-full border border-black/[0.05] bg-white/96 px-3 py-2 text-[12px] text-[#5e6573] shadow-[0_8px_22px_rgba(17,24,39,0.06)] backdrop-blur"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  <span className="max-w-[140px] truncate">{attachment.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    aria-label={`Remove ${attachment.name}`}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[#7d8593] transition-all duration-200 ease-out hover:text-[#2f3640] active:scale-[0.97]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {notice ? (
          <div className="pointer-events-none fixed inset-x-0 top-[88px] z-40 mx-auto w-full max-w-[560px] px-5">
            <div className="pointer-events-auto ml-auto w-fit max-w-[320px] rounded-[18px] border border-black/[0.05] bg-white/92 px-4 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="text-[13px] font-semibold tracking-[-0.01em] text-[#364152]">
                {notice.title}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-[#6a7382]">
                {notice.detail}
              </p>
            </div>
          </div>
        ) : null}

        <KivoComposerDock
          value={draftPrompt}
          onChange={setDraftPrompt}
          onSend={handleSend}
          onPlusClick={() => openFilePicker()}
          onQuickActionClick={() => setQuickSheetOpen(true)}
          onMicClick={toggleMic}
          canSend={canSend}
          isListening={isListening}
          isSending={isSending || isAgentResponding}
          placeholder={placeholder}
        />

        <KivoQuickSheet
          open={quickSheetOpen}
          onClose={() => setQuickSheetOpen(false)}
          onNewChat={createNewChat}
          onOpenFiles={() => openFilePicker()}
          onOpenImages={() => openFilePicker('image/*')}
          onToggleMic={toggleMic}
          onNavigate={handleQuickNavigate}
        />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={filePickerAccept}
          className="hidden"
          onChange={(event) => {
            addAttachments(event.target.files ?? []);
            event.currentTarget.value = '';
            setFilePickerAccept('');
          }}
        />
      </div>
    </div>
  );
}
