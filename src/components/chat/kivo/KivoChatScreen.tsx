'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { AlertCircle, Paperclip, X } from 'lucide-react';
import { useAppStore } from '@/app/store/app-store';
import type { MessageAttachment } from '@/app/store/app-store';
import { MessageThread } from '@/components/chat/MessageThread';
import { WorkspaceSheet } from '@/components/chat/WorkspaceSheet';
import { KivoChatHeader } from './KivoChatHeader';
import { KivoComposerDock } from './KivoComposerDock';
import { KivoReferralSuccessToast } from './KivoReferralSuccessToast';

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

const COMPOSER_DOCK_HEIGHT = 176;
const ATTACHMENT_TRAY_HEIGHT = 64;
const SAFE_BOTTOM_SPACE = 28;
const BASE_SCROLL_BOTTOM_PADDING = COMPOSER_DOCK_HEIGHT + SAFE_BOTTOM_SPACE;
const SCROLL_BOTTOM_PADDING_WITH_ATTACHMENTS =
  COMPOSER_DOCK_HEIGHT + ATTACHMENT_TRAY_HEIGHT + SAFE_BOTTOM_SPACE + 18;

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
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [referralToastOpen, setReferralToastOpen] = useState(false);
  const [referralToastTitle, setReferralToastTitle] = useState('');
  const [referralToastDetail, setReferralToastDetail] = useState('');

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const noticeTimeoutRef = useRef<number | null>(null);
  const mainScrollRef = useRef<HTMLDivElement | null>(null);
  const lastMessageCountRef = useRef(0);

  const hasMessages = messages.length > 0;
  const hasAttachments = attachments.length > 0;
  const canSend = draftPrompt.trim().length > 0 || hasAttachments;
  const isBusy = isSending || isAgentResponding;

  const scrollBottomPadding = hasAttachments
    ? SCROLL_BOTTOM_PADDING_WITH_ATTACHMENTS
    : BASE_SCROLL_BOTTOM_PADDING;

  const placeholder = useMemo(() => {
    if (hasAttachments && !draftPrompt.trim()) {
      return 'Add a message or send attachments';
    }
    return 'Assign a task or ask anything';
  }, [hasAttachments, draftPrompt]);

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
    setWorkspaceOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const referral = url.searchParams.get('referral');
    const rewardType = url.searchParams.get('referralRewardType');
    const rewardAmount = url.searchParams.get('referralRewardAmount');
    const rewardLabel = url.searchParams.get('referralRewardLabel');

    if (referral !== 'success') return;

    let detail = 'Your referral reward was added successfully.';

    if (rewardLabel?.trim()) {
      detail = rewardLabel;
    } else if (rewardType === 'bonus_runs' && rewardAmount) {
      detail = `+${rewardAmount} bonus runs added`;
    } else if (rewardType === 'plus_days' && rewardAmount) {
      detail = `${rewardAmount} days of Plus were added`;
    }

    setReferralToastTitle('Invite successful');
    setReferralToastDetail(detail);
    setReferralToastOpen(true);

    const timeout = window.setTimeout(() => {
      setReferralToastOpen(false);
    }, 3200);

    url.searchParams.delete('referral');
    url.searchParams.delete('referralRewardType');
    url.searchParams.delete('referralRewardAmount');
    url.searchParams.delete('referralRewardLabel');

    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });

    return () => {
      window.clearTimeout(timeout);
    };
  }, [router]);

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

  useEffect(() => {
    const scroller = mainScrollRef.current;
    if (!scroller) return;

    const messageCountChanged = messages.length !== lastMessageCountRef.current;
    const shouldAutoScroll =
      messageCountChanged || isAgentResponding || isSending;

    if (!shouldAutoScroll) return;

    requestAnimationFrame(() => {
      scroller.scrollTo({
        top: scroller.scrollHeight,
        behavior: messageCountChanged ? 'smooth' : 'auto',
      });
    });

    lastMessageCountRef.current = messages.length;
  }, [messages.length, isAgentResponding, isSending]);

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
    setWorkspaceOpen(false);

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

    focusComposer();
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
      focusComposer();
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
    if (!canSend || isBusy) return;

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
      setWorkspaceOpen(false);
      focusComposer();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-[#2f3640]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f9f9fb_0%,#f4f5f8_34%,#eef2f8_100%)]" />

        <div className="absolute inset-x-0 top-0 h-[220px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.58)_42%,rgba(255,255,255,0)_80%)]" />

        <motion.div
          className="absolute left-1/2 top-[50%] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,rgba(255,255,255,0.86)_24%,rgba(245,247,252,0.64)_44%,rgba(236,240,248,0.28)_66%,rgba(236,240,248,0)_100%)] blur-[46px]"
          animate={{ x: [0, 6, 0], y: [0, -4, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute left-[-24%] bottom-[185px] h-[230px] w-[148%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,1)_0%,rgba(246,248,252,0.92)_26%,rgba(236,241,248,0.58)_54%,rgba(229,235,245,0.18)_78%,rgba(229,235,245,0)_100%)] blur-[10px]"
          animate={{ x: [0, 10, 0], y: [0, -3, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute left-[-20%] bottom-[120px] h-[255px] w-[142%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(244,247,252,0.95)_0%,rgba(236,241,248,0.82)_32%,rgba(227,234,244,0.50)_58%,rgba(220,228,240,0.16)_80%,rgba(220,228,240,0)_100%)] blur-[16px]"
          animate={{ x: [0, -12, 0], y: [0, 4, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute left-[-16%] bottom-[48px] h-[300px] w-[134%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(234,240,248,0.94)_0%,rgba(226,233,244,0.76)_34%,rgba(217,225,239,0.50)_60%,rgba(212,220,236,0.18)_80%,rgba(212,220,236,0)_100%)] blur-[24px]"
          animate={{ x: [0, 8, 0], y: [0, -5, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute left-[-12%] bottom-[-10px] h-[250px] w-[126%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(225,232,244,0.88)_0%,rgba(218,226,239,0.60)_38%,rgba(212,221,236,0.28)_66%,rgba(212,221,236,0)_100%)] blur-[28px]"
          animate={{ x: [0, -6, 0], y: [0, 4, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="absolute left-[10%] bottom-[132px] h-[96px] w-[80%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.24)_54%,rgba(255,255,255,0)_100%)] blur-[20px]" />

        <div className="absolute inset-x-0 bottom-[108px] h-[300px] bg-[linear-gradient(180deg,rgba(245,246,248,0)_0%,rgba(245,246,248,0.16)_20%,rgba(245,246,248,0.48)_48%,rgba(245,246,248,0.82)_76%,rgba(245,246,248,1)_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[560px] flex-col">
        <KivoChatHeader />

        <main
          ref={mainScrollRef}
          className="relative flex min-h-0 flex-1 flex-col overflow-y-auto"
          style={{ paddingBottom: scrollBottomPadding }}
        >
          <AnimatePresence initial={false}>
            {streamError ? (
              <motion.div
                key="stream-error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="px-6 pt-4"
              >
                <div className="flex items-start gap-2 rounded-[18px] border border-[#edd5d5] bg-[#fff6f6] px-4 py-3 text-sm text-[#8b4a4a] shadow-[0_8px_20px_rgba(127,29,29,0.05)]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{streamError}</span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            {!hasMessages ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="flex min-h-0 flex-1 items-start justify-center px-8 pt-[18vh]"
              >
                <h2
                  className="max-w-[420px] text-center text-[38px] font-normal leading-[1.05] tracking-[-0.065em] text-[#343945] sm:text-[46px]"
                  style={{ fontFamily: 'ui-serif, Georgia, Times, serif' }}
                >
                  What can I do for you?
                </h2>
              </motion.div>
            ) : (
              <motion.div
                key="message-state"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="flex min-h-0 flex-1 flex-col px-1 pt-3"
              >
                <MessageThread
                  messages={messages}
                  pending={isAgentResponding || isSending}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <AnimatePresence initial={false}>
          {hasAttachments ? (
            <motion.div
              key="attachment-tray"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="pointer-events-none fixed inset-x-0 bottom-[138px] z-20 mx-auto w-full max-w-[560px] px-5"
            >
              <div className="pointer-events-auto mx-auto flex max-w-[500px] flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3 py-2 text-[12px] text-[#5e6573] shadow-[0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur-2xl"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span className="max-w-[150px] truncate">{attachment.name}</span>
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
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {notice ? (
            <motion.div
              key="notice"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="pointer-events-none fixed inset-x-0 top-[88px] z-40 mx-auto w-full max-w-[560px] px-5"
            >
              <div className="pointer-events-auto ml-auto w-fit max-w-[320px] rounded-[18px] border border-white/70 bg-white/88 px-4 py-3 shadow-[0_18px_38px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
                <p className="text-[13px] font-semibold tracking-[-0.01em] text-[#364152]">
                  {notice.title}
                </p>
                <p className="mt-1 text-[12px] leading-5 text-[#6a7382]">
                  {notice.detail}
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <KivoComposerDock
          value={draftPrompt}
          onChange={setDraftPrompt}
          onSend={handleSend}
          onPlusClick={() => openFilePicker()}
          onQuickActionClick={() => setWorkspaceOpen(true)}
          onMicClick={toggleMic}
          canSend={canSend}
          isListening={isListening}
          isSending={isBusy}
          placeholder={placeholder}
        />

        <KivoReferralSuccessToast
          open={referralToastOpen}
          title={referralToastTitle}
          detail={referralToastDetail}
          onClose={() => setReferralToastOpen(false)}
        />

        <WorkspaceSheet
          open={workspaceOpen}
          onClose={() => setWorkspaceOpen(false)}
          onQuickAction={(id) => {
            if (id === 'ask-agent') {
              setWorkspaceOpen(false);
              focusComposer();
              return;
            }

            if (id === 'analyze') {
              setWorkspaceOpen(false);
              router.push('/analyze');
              return;
            }

            if (id === 'planner') {
              setWorkspaceOpen(false);
              router.push('/actions?type=planner');
              return;
            }

            setWorkspaceOpen(false);
            router.push('/money-saver');
          }}
          onConnectorAction={(connector, mode) => {
            setWorkspaceOpen(false);

            if (connector === 'gmail') {
              router.push('/control');
              return;
            }

            if (connector === 'google-calendar') {
              router.push('/control');
              return;
            }

            if (connector === 'google-drive') {
              router.push('/control');
              return;
            }

            if (connector === 'outlook') {
              router.push('/control');
              return;
            }

            if (connector === 'browser' && mode === 'connect') {
              router.push('/tools');
              return;
            }

            if (connector === 'github') {
              return;
            }

            router.push('/tools');
          }}
          onToolSelect={(id) => {
            setWorkspaceOpen(false);

            if (id === 'finance-scanner') {
              router.push('/money');
              return;
            }

            if (id === 'memory-search') {
              router.push('/memory');
              return;
            }

            if (id === 'research-mode') {
              router.push('/agents');
              return;
            }

            if (id === 'compare-tool') {
              router.push('/actions');
              return;
            }

            router.push('/tools');
          }}
          onRecentSelect={(id) => {
            setWorkspaceOpen(false);

            if (id === 'gmail-sync') {
              router.push('/control');
              return;
            }

            if (id === 'subscription-scan') {
              router.push('/money-saver');
              return;
            }

            router.push('/actions?type=planner');
          }}
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
