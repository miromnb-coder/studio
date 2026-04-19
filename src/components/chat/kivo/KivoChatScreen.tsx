'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { AlertCircle, Paperclip, X } from 'lucide-react';
import { useAppStore } from '@/app/store/app-store';
import type { MessageAttachment } from '@/app/store/app-store';
import { MessageThread } from '@/components/chat/MessageThread';
import { WorkspaceSheet } from '@/components/chat/WorkspaceSheet';
import { KivoActionSheet } from './KivoActionSheet';
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

type WorkspaceQuickActionId = 'analyze' | 'planner' | 'money-saver' | 'ask-agent';
type WorkspaceToolId =
  | 'finance-scanner'
  | 'memory-search'
  | 'research-mode'
  | 'compare-tool'
  | 'automation-builder';
type WorkspaceRecentId = 'gmail-sync' | 'subscription-scan' | 'weekly-planner';
type ConnectorMode = 'connect' | 'connected' | 'manage' | 'toggle';

type AiActionId = 'summarize-day' | 'find-priorities' | 'deep-research' | 'live-search';
type ProductivityToolId = 'gmail' | 'calendar' | 'money-saver' | 'tasks';

const NEAR_BOTTOM_THRESHOLD = 140;
const SCROLL_MEMORY_KEY = 'kivo-chat-scroll-memory-v1';
const MIN_SCROLL_SAFETY_SPACE = 28;

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
  const activeConversationId = useAppStore((s) => s.activeConversationId);

  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [filePickerAccept, setFilePickerAccept] = useState('');
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [referralToastOpen, setReferralToastOpen] = useState(false);
  const [referralToastTitle, setReferralToastTitle] = useState('');
  const [referralToastDetail, setReferralToastDetail] = useState('');

  const [gmailConnected, setGmailConnected] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const noticeTimeoutRef = useRef<number | null>(null);
  const mainScrollRef = useRef<HTMLDivElement | null>(null);
  const lastMessageCountRef = useRef(0);
  const isNearBottomRef = useRef(true);
  const scrollMemoryRef = useRef<Record<string, number>>({});
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [bottomOverlayInset, setBottomOverlayInset] = useState(0);
  const scrollTickingRef = useRef(false);
  const composerDockRef = useRef<HTMLDivElement | null>(null);
  const attachmentTrayRef = useRef<HTMLDivElement | null>(null);
  const viewportSyncFrameRef = useRef<number | null>(null);

  const hasMessages = messages.length > 0;
  const hasAttachments = attachments.length > 0;
  const canSend = draftPrompt.trim().length > 0 || hasAttachments;
  const isBusy = isSending || isAgentResponding;

  const scrollBottomPadding = Math.max(
    MIN_SCROLL_SAFETY_SPACE,
    bottomOverlayInset + MIN_SCROLL_SAFETY_SPACE,
  );
  const lastMessageSafetySpacer = Math.max(40, Math.round(bottomOverlayInset * 0.18));
  const latestButtonBottom = Math.max(
    12,
    Math.round(bottomOverlayInset + MIN_SCROLL_SAFETY_SPACE),
  );

  const measureBottomOverlayInset = useCallback(() => {
    if (typeof window === 'undefined') return;

    const viewportBottom = window.visualViewport
      ? window.visualViewport.height + window.visualViewport.offsetTop
      : window.innerHeight;
    const scrollerBottom =
      mainScrollRef.current?.getBoundingClientRect().bottom ?? viewportBottom;
    const measurementBottom = Math.min(viewportBottom, scrollerBottom);
    const nodes = [composerDockRef.current, attachmentTrayRef.current].filter(
      (node): node is HTMLElement => Boolean(node),
    );

    const nextInset = nodes.reduce((maxInset, node) => {
      const rect = node.getBoundingClientRect();
      if (rect.height <= 0 || rect.width <= 0) return maxInset;
      return Math.max(maxInset, Math.max(0, measurementBottom - rect.top));
    }, 0);

    setBottomOverlayInset((current) =>
      Math.abs(current - nextInset) < 1 ? current : nextInset,
    );
  }, []);

  const persistScrollMemory = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(
      SCROLL_MEMORY_KEY,
      JSON.stringify(scrollMemoryRef.current),
    );
  }, []);

  const updateScrollState = useCallback(() => {
    const scroller = mainScrollRef.current;
    if (!scroller) return;

    const distanceFromBottom =
      scroller.scrollHeight - (scroller.scrollTop + scroller.clientHeight);
    const nearBottom = distanceFromBottom <= NEAR_BOTTOM_THRESHOLD;

    isNearBottomRef.current = nearBottom;
    setShowScrollToLatest(!nearBottom && hasMessages);

    scrollMemoryRef.current[activeConversationId] = Math.max(distanceFromBottom, 0);
  }, [activeConversationId, hasMessages]);

  const scrollToLatest = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const scroller = mainScrollRef.current;
      if (!scroller) return;

      scroller.scrollTo({
        top: scroller.scrollHeight,
        behavior,
      });
    },
    [],
  );

  const placeholder = useMemo(() => {
    if (hasAttachments && !draftPrompt.trim()) {
      return 'Add a message or send attachments';
    }
    return 'Assign a task or ask anything';
  }, [hasAttachments, draftPrompt]);

  const refinedStreamError = useMemo(() => {
    const raw = (streamError || '').trim();
    if (!raw) return '';
    if (raw.startsWith('AUTH_REQUIRED:')) {
      return 'Please sign in to continue.';
    }
    if (raw.toLowerCase().includes('gmail')) {
      return 'Could not access Gmail right now.';
    }
    if (raw.toLowerCase().includes('calendar')) {
      return 'Calendar is unavailable right now.';
    }
    return 'Something went wrong. Please try again.';
  }, [streamError]);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.sessionStorage.getItem(SCROLL_MEMORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, number>;
      if (parsed && typeof parsed === 'object') {
        scrollMemoryRef.current = parsed;
      }
    } catch {
      scrollMemoryRef.current = {};
    }
  }, []);

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
    setActionSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const viewport = window.visualViewport;

    const syncKeyboardOffset = () => {
      if (viewportSyncFrameRef.current !== null) {
        window.cancelAnimationFrame(viewportSyncFrameRef.current);
      }

      viewportSyncFrameRef.current = window.requestAnimationFrame(() => {
        viewportSyncFrameRef.current = null;

        const nextOffset = Math.max(
          0,
          window.innerHeight - viewport.height - viewport.offsetTop,
        );
        setKeyboardOffset((current) =>
          Math.abs(current - nextOffset) < 1 ? current : nextOffset,
        );
        measureBottomOverlayInset();
      });
    };

    const syncViewportLayout = () => {
      const nextOffset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setKeyboardOffset((current) =>
        Math.abs(current - nextOffset) < 1 ? current : nextOffset,
      );
      measureBottomOverlayInset();
    };

    syncViewportLayout();

    const resizeObserver = new ResizeObserver(() => {
      measureBottomOverlayInset();
    });

    if (composerDockRef.current) {
      resizeObserver.observe(composerDockRef.current);
    }
    if (attachmentTrayRef.current) {
      resizeObserver.observe(attachmentTrayRef.current);
    }

    viewport.addEventListener('resize', syncKeyboardOffset);
    viewport.addEventListener('scroll', syncKeyboardOffset);
    window.addEventListener('resize', measureBottomOverlayInset);

    return () => {
      if (viewportSyncFrameRef.current !== null) {
        window.cancelAnimationFrame(viewportSyncFrameRef.current);
        viewportSyncFrameRef.current = null;
      }
      resizeObserver.disconnect();
      viewport.removeEventListener('resize', syncKeyboardOffset);
      viewport.removeEventListener('scroll', syncKeyboardOffset);
      window.removeEventListener('resize', measureBottomOverlayInset);
    };
  }, [measureBottomOverlayInset]);

  useEffect(() => {
    measureBottomOverlayInset();
  }, [attachments.length, draftPrompt, keyboardOffset, measureBottomOverlayInset]);

  useEffect(() => {
    if (!mainScrollRef.current) return;

    if (isNearBottomRef.current) {
      requestAnimationFrame(() => {
        scrollToLatest('auto');
        updateScrollState();
      });
      return;
    }

    updateScrollState();
  }, [bottomOverlayInset, scrollToLatest, updateScrollState]);

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

    const handleScroll = () => {
      if (scrollTickingRef.current) return;
      scrollTickingRef.current = true;

      requestAnimationFrame(() => {
        updateScrollState();
        scrollTickingRef.current = false;
      });
    };

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollState();

    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      scrollTickingRef.current = false;
      updateScrollState();
      persistScrollMemory();
    };
  }, [persistScrollMemory, updateScrollState]);

  useEffect(() => {
    const scroller = mainScrollRef.current;
    if (!scroller) return;

    const preservedDistance = scrollMemoryRef.current[activeConversationId];

    requestAnimationFrame(() => {
      if (
        typeof preservedDistance === 'number' &&
        Number.isFinite(preservedDistance)
      ) {
        scroller.scrollTop = Math.max(
          0,
          scroller.scrollHeight - scroller.clientHeight - preservedDistance,
        );
      } else {
        scroller.scrollTop = scroller.scrollHeight;
      }

      updateScrollState();
    });

    lastMessageCountRef.current = messages.length;
  }, [activeConversationId, messages.length, updateScrollState]);

  const lastMessageKey = useMemo(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return 'empty';
    return `${lastMessage.id}:${lastMessage.content.length}:${lastMessage.isStreaming ? 's' : 'f'}:${messages.length}`;
  }, [messages]);

  useEffect(() => {
    const messageCountChanged = messages.length !== lastMessageCountRef.current;
    const shouldFollow =
      isNearBottomRef.current ||
      (messageCountChanged &&
        messages[messages.length - 1]?.role === 'user');

    if (!shouldFollow) {
      lastMessageCountRef.current = messages.length;
      return;
    }

    const behavior: ScrollBehavior = messageCountChanged ? 'smooth' : 'auto';
    requestAnimationFrame(() => {
      scrollToLatest(behavior);
      updateScrollState();
    });

    lastMessageCountRef.current = messages.length;
  }, [isAgentResponding, isSending, lastMessageKey, messages, scrollToLatest, updateScrollState]);

  useEffect(() => {
    if (!actionSheetOpen) return;

    const hydrateToolState = async () => {
      try {
        const [gmailResponse, calendarResponse] = await Promise.all([
          fetch('/api/integrations/gmail/status', { cache: 'no-store' }),
          fetch('/api/integrations/google-calendar/status', { cache: 'no-store' }),
        ]);

        if (gmailResponse.ok) {
          const gmail = (await gmailResponse.json()) as { connected?: boolean };
          setGmailConnected(gmail.connected === true);
        }

        if (calendarResponse.ok) {
          const calendar = (await calendarResponse.json()) as { connected?: boolean };
          setCalendarConnected(calendar.connected === true);
        }
      } catch {
        // keep last known states
      }
    };

    void hydrateToolState();
  }, [actionSheetOpen]);

  const showNotice = useCallback((title: string, detail: string) => {
    setNotice({ title, detail });
  }, []);

  const cleanupAttachments = useCallback((items: MessageAttachment[]) => {
    items.forEach((attachment) => {
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    });
  }, []);

  const focusComposer = useCallback(() => {
    requestAnimationFrame(() => {
      const textarea = document.getElementById(
        'kivo-composer-textarea',
      ) as HTMLTextAreaElement | null;
      textarea?.focus();
    });
  }, []);

  const closeWorkspace = useCallback(() => {
    setWorkspaceOpen(false);
  }, []);

  const closeActionSheet = useCallback(() => {
    setActionSheetOpen(false);
  }, []);

  const openOperatorRoute = useCallback(
    (route: string) => {
      closeWorkspace();
      router.push(route);
    },
    [closeWorkspace, router],
  );

  const createNewChat = useCallback(() => {
    const conversationId = createConversation();
    openConversation(conversationId);

    cleanupAttachments(attachments);
    setAttachments([]);
    setDraftPrompt('');
    closeWorkspace();
    closeActionSheet();

    router.push('/chat');
    focusComposer();
  }, [
    attachments,
    cleanupAttachments,
    closeWorkspace,
    closeActionSheet,
    createConversation,
    focusComposer,
    openConversation,
    router,
    setDraftPrompt,
  ]);

  const toAttachment = useCallback((file: File): MessageAttachment => {
    return {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      kind: file.type.startsWith('image/') ? 'image' : 'file',
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    };
  }, []);

  const addAttachments = useCallback(
    (files: FileList | File[]) => {
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
    },
    [focusComposer, showNotice, toAttachment],
  );

  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === attachmentId);

      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return prev.filter((item) => item.id !== attachmentId);
    });
  }, []);

  const openFilePicker = useCallback((accept = '') => {
    setFilePickerAccept(accept);
    fileInputRef.current?.click();
  }, []);

  const ensureSpeechRecognition = useCallback(() => {
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
  }, [draftPrompt, focusComposer, setDraftPrompt, showNotice]);

  const toggleMic = useCallback(() => {
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
  }, [ensureSpeechRecognition, isListening, showNotice]);

  const handlePasteLink = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
      showNotice('Clipboard unavailable', 'Paste is not supported in this browser.');
      return;
    }

    try {
      const value = (await navigator.clipboard.readText()).trim();
      if (!value) {
        showNotice('Clipboard is empty', 'Copy a link first, then try again.');
        return;
      }

      const currentDraft =
        typeof useAppStore.getState === 'function'
          ? useAppStore.getState().draftPrompt
          : draftPrompt;

      setDraftPrompt(currentDraft ? `${currentDraft} ${value}` : value);
      showNotice('Link pasted', 'Added link to your message.');
      focusComposer();
    } catch {
      showNotice('Paste blocked', 'Allow clipboard permission and try again.');
    }
  }, [draftPrompt, focusComposer, setDraftPrompt, showNotice]);

  const handleAiAction = useCallback(
    (id: AiActionId) => {
      const prompts = {
        'summarize-day':
          'Summarize my day and turn everything into a clear plan with time blocks.',
        'find-priorities':
          'Find my top priorities right now and explain what I should do first.',
        'deep-research':
          'Help me do deep research on this topic with steps, sources, and tradeoffs:',
        'live-search':
          'Use live web search to get current information about:',
      } as const;

      setDraftPrompt(prompts[id]);
      focusComposer();
    },
    [focusComposer, setDraftPrompt],
  );

  const handleActionTool = useCallback(
    (id: ProductivityToolId) => {
      if (id === 'gmail') {
        if (!gmailConnected) {
          window.location.assign('/api/integrations/gmail/connect');
          return;
        }
        openOperatorRoute('/actions?tool=gmail');
        return;
      }

      if (id === 'calendar') {
        if (!calendarConnected) {
          window.location.assign('/api/integrations/google-calendar/connect');
          return;
        }
        openOperatorRoute('/actions?tool=google-calendar');
        return;
      }

      if (id === 'money-saver') {
        openOperatorRoute('/money-saver');
        return;
      }

      openOperatorRoute('/tasks');
    },
    [calendarConnected, gmailConnected, openOperatorRoute],
  );

  const handleSend = useCallback(async () => {
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
      closeWorkspace();
      closeActionSheet();
      focusComposer();
    } finally {
      setIsSending(false);
    }
  }, [
    attachments,
    canSend,
    cleanupAttachments,
    closeActionSheet,
    closeWorkspace,
    draftPrompt,
    focusComposer,
    isBusy,
    router,
    sendMessage,
    setDraftPrompt,
    showNotice,
    user?.id,
  ]);

  const handleQuickAction = useCallback(
    (id: WorkspaceQuickActionId) => {
      if (id === 'ask-agent') {
        closeWorkspace();
        focusComposer();
        return;
      }

      if (id === 'analyze') {
        openOperatorRoute('/analyze');
        return;
      }

      if (id === 'planner') {
        openOperatorRoute('/actions?type=planner');
        return;
      }

      openOperatorRoute('/money-saver');
    },
    [closeWorkspace, focusComposer, openOperatorRoute],
  );

  const handleConnectorAction = useCallback(
    (connector: string, mode: ConnectorMode) => {
      const requireAuthThenOpen = (path: string) => {
        if (!user?.id) {
          router.push('/login?next=/chat');
          return;
        }
        window.location.assign(path);
      };

      const disconnect = async (id: string) => {
        if (id === 'gmail') {
          await fetch('/api/integrations/gmail/disconnect', { method: 'POST' });
          setGmailConnected(false);
          return;
        }
        if (id === 'google-calendar') {
          await fetch('/api/integrations/google-calendar/disconnect', { method: 'POST' });
          setCalendarConnected(false);
          return;
        }
      };

      if (connector === 'gmail') {
        if (mode === 'connect') {
          requireAuthThenOpen('/api/integrations/gmail/connect');
          return;
        }
        if (mode === 'toggle') {
          void disconnect('gmail');
          return;
        }
        if (mode === 'connected' || mode === 'manage') {
          openOperatorRoute('/actions?tool=gmail');
          return;
        }
      }

      if (connector === 'google-calendar') {
        if (mode === 'connect') {
          requireAuthThenOpen('/api/integrations/google-calendar/connect');
          return;
        }
        if (mode === 'toggle') {
          void disconnect('google-calendar');
          return;
        }
        if (mode === 'connected' || mode === 'manage') {
          openOperatorRoute('/actions?tool=google-calendar');
          return;
        }
      }

      if (connector === 'browser') {
        if (!user?.id) {
          router.push('/login?next=/tools?tool=browser-search');
          return;
        }

        if (mode === 'connect' || mode === 'connected' || mode === 'manage') {
          openOperatorRoute('/tools?tool=browser-search');
          return;
        }

        if (mode === 'toggle') {
          showNotice('Browser Search disabled', 'You can enable it again any time.');
          return;
        }
      }

      if (connector === 'google-drive') {
        openOperatorRoute('/tools?source=drive');
        return;
      }

      if (connector === 'outlook') {
        openOperatorRoute('/tools');
        return;
      }

      if (connector === 'github') {
        openOperatorRoute('/agents');
        return;
      }

      openOperatorRoute('/tools');
    },
    [openOperatorRoute, router, showNotice, user?.id],
  );

  const handleToolSelect = useCallback(
    (id: WorkspaceToolId) => {
      if (id === 'finance-scanner') {
        openOperatorRoute('/money');
        return;
      }

      if (id === 'memory-search') {
        openOperatorRoute('/memory');
        return;
      }

      if (id === 'research-mode') {
        openOperatorRoute('/agents');
        return;
      }

      if (id === 'compare-tool') {
        openOperatorRoute('/actions');
        return;
      }

      openOperatorRoute('/tools');
    },
    [openOperatorRoute],
  );

  const handleRecentSelect = useCallback(
    (id: WorkspaceRecentId) => {
      if (id === 'gmail-sync') {
        openOperatorRoute('/actions?tool=gmail');
        return;
      }

      if (id === 'subscription-scan') {
        openOperatorRoute('/actions?tool=gmail');
        return;
      }

      openOperatorRoute('/actions?type=planner');
    },
    [openOperatorRoute],
  );

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-transparent text-[#2f3640]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8f8f9_0%,#f4f5f7_36%,#eef2f6_100%)]" />

        <div className="absolute inset-x-0 top-0 h-[220px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.42)_46%,rgba(255,255,255,0)_82%)]" />

        <motion.div
          className="absolute left-1/2 top-[43%] h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.82)_0%,rgba(248,250,253,0.46)_36%,rgba(241,244,249,0.12)_68%,rgba(241,244,249,0)_100%)] blur-[26px]"
          animate={{ opacity: [0.86, 1, 0.86] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute left-1/2 bottom-[110px] h-[210px] w-[82%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.82)_0%,rgba(246,248,252,0.42)_52%,rgba(246,248,252,0)_100%)] blur-[26px]"
          animate={{ opacity: [0.74, 0.94, 0.74] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="absolute inset-x-0 bottom-0 h-[280px] bg-[linear-gradient(180deg,rgba(244,246,249,0)_0%,rgba(241,244,248,0.34)_36%,rgba(236,240,246,0.88)_76%,rgba(234,239,246,1)_100%)]" />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-[560px] flex-col">
        <KivoChatHeader />

        <main
          ref={mainScrollRef}
          className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]"
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
                <div className="flex items-start gap-2 rounded-[18px] border border-black/[0.07] bg-white/88 px-4 py-3 text-sm text-[#5f6877] shadow-[0_12px_28px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#7a8598]" />
                  <span>{refinedStreamError}</span>
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
                  className="max-w-[340px] text-center text-[34px] font-normal leading-[1.08] tracking-[-0.05em] text-[#353b45] sm:text-[40px]"
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

          <div
            aria-hidden="true"
            className="w-full shrink-0"
            style={{ height: lastMessageSafetySpacer }}
          />
        </main>

        <AnimatePresence initial={false}>
          {showScrollToLatest ? (
            <motion.button
              key="scroll-to-latest"
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={() => {
                scrollToLatest('smooth');
                requestAnimationFrame(() => updateScrollState());
              }}
              className="fixed right-5 z-30 inline-flex items-center rounded-full border border-black/[0.08] bg-white/90 px-3 py-2 text-[12px] font-medium tracking-[-0.01em] text-[#495264] shadow-[0_10px_24px_rgba(15,23,42,0.09)] backdrop-blur-md transition-all duration-150 hover:bg-white"
              style={{
                bottom: `${latestButtonBottom}px`,
              }}
            >
              Latest
            </motion.button>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {hasAttachments ? (
            <motion.div
              key="attachment-tray"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="pointer-events-none fixed inset-x-0 z-20 mx-auto w-full max-w-[560px] px-5"
              ref={attachmentTrayRef}
              style={{
                bottom: `calc(138px + env(safe-area-inset-bottom, 0px) + ${Math.max(0, keyboardOffset)}px)`,
              }}
            >
              <div className="pointer-events-auto mx-auto flex max-w-[500px] flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="inline-flex items-center gap-2 rounded-full border border-black/[0.05] bg-white/96 px-3 py-2 text-[12px] text-[#5e6573] shadow-[0_8px_22px_rgba(17,24,39,0.06)] backdrop-blur"
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
              <div className="pointer-events-auto ml-auto w-fit max-w-[320px] rounded-[18px] border border-black/[0.05] bg-white/92 px-4 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.08)] backdrop-blur">
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
          onPlusClick={() => setActionSheetOpen(true)}
          onQuickActionClick={() => setWorkspaceOpen(true)}
          onMicClick={toggleMic}
          canSend={canSend}
          isListening={isListening}
          isSending={isBusy}
          placeholder={placeholder}
          keyboardOffset={keyboardOffset}
          containerRef={composerDockRef}
        />

        <KivoReferralSuccessToast
          open={referralToastOpen}
          title={referralToastTitle}
          detail={referralToastDetail}
          onClose={() => setReferralToastOpen(false)}
        />

        <KivoActionSheet
          open={actionSheetOpen}
          isListening={isListening}
          attachments={attachments}
          toolState={{
            gmail: {
              connected: gmailConnected,
              subtitle: 'Inbox summary, urgent emails, subscriptions',
            },
            calendar: {
              connected: calendarConnected,
              subtitle: 'Today plan, reminders, free time',
            },
            'money-saver': {
              connected: true,
              subtitle: 'Find leaks, subscriptions, savings',
            },
            tasks: {
              connected: true,
              subtitle: 'Notes, todos, action items',
            },
          }}
          onClose={closeActionSheet}
          onAddImages={() => openFilePicker('image/*')}
          onAddFiles={() => openFilePicker()}
          onPasteLink={handlePasteLink}
          onVoiceInput={toggleMic}
          onAiAction={handleAiAction}
          onToolAction={handleActionTool}
        />

        <WorkspaceSheet
          open={workspaceOpen}
          onClose={closeWorkspace}
          onQuickAction={handleQuickAction}
          onConnectorAction={handleConnectorAction}
          onToolSelect={handleToolSelect}
          onRecentSelect={handleRecentSelect}
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
