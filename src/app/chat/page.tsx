'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ImagePlus,
  MessageSquarePlus,
  Mic,
  ReceiptText,
  Sparkles,
  Upload,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../store/app-store';
import type { MessageAttachment } from '../store/app-store';
import { AppShell } from '@/components/chat/AppShell';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { Composer } from '@/components/chat/Composer';
import { MessageThread } from '@/components/chat/MessageThread';
import { BottomActionSheet } from '@/components/chat/BottomActionSheet';
import { WorkspaceSheet } from '@/components/chat/WorkspaceSheet';
import { ConversationDrawer } from '@/components/chat/ConversationDrawer';
import type { ConversationFilter } from '@/components/chat/ConversationFilters';
import type { ConnectorMode } from '@/components/chat/ConnectorRow';

type ActionNotice = {
  title: string;
  detail: string;
};

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

const PLUS_ACTIONS = [
  { id: 'new-chat', label: 'New Chat', icon: MessageSquarePlus },
  { id: 'upload-image', label: 'Upload Image', icon: ImagePlus },
  { id: 'upload-file', label: 'Upload File', icon: Upload },
  { id: 'voice-input', label: 'Voice Input', icon: Mic },
  { id: 'quick-action', label: 'Quick Action', icon: Sparkles },
  {
    id: 'scan-receipt',
    label: 'Scan Receipt',
    icon: ReceiptText,
    subtitle: 'Coming Soon',
    disabled: true,
  },
] as const;

type CreateActionId = (typeof PLUS_ACTIONS)[number]['id'];

export default function ChatPage() {
  const router = useRouter();
  const pathname = usePathname();

  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const messages = useAppStore((s) => s.messages);
  const streamError = useAppStore((s) => s.streamError);
  const isAgentResponding = useAppStore((s) => s.isAgentResponding);
  const conversationList = useAppStore((s) => s.conversationList);
  const messageState = useAppStore((s) => s.messageState);
  const draftState = useAppStore((s) => s.draftState);

  const createConversation = useAppStore((s) => s.createConversation);
  const openConversation = useAppStore((s) => s.openConversation);
  const draftPrompt = useAppStore((s) => s.draftPrompt);
  const setDraftPrompt = useAppStore((s) => s.setDraftPrompt);
  const sendMessage = useAppStore((s) => s.sendMessage);

  const [createOpen, setCreateOpen] = useState(false);
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [conversationDrawerOpen, setConversationDrawerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [listening, setListening] = useState(false);
  const [composerAttachments, setComposerAttachments] = useState<MessageAttachment[]>([]);
  const [filePickerAccept, setFilePickerAccept] = useState('');
  const [conversationSearch, setConversationSearch] = useState('');
  const [conversationFilter, setConversationFilter] =
    useState<ConversationFilter>('all');
  const [savedConversationIds, setSavedConversationIds] = useState<string[]>([]);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const noticeTimeoutRef = useRef<number | null>(null);

  const hasText = draftPrompt.trim().length > 0;

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    return () => {
      composerAttachments.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      });
    };
  }, [composerAttachments]);

  useEffect(() => {
    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current);
      noticeTimeoutRef.current = null;
    }

    if (!notice) return;

    noticeTimeoutRef.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimeoutRef.current = null;
    }, 2200);

    return () => {
      if (noticeTimeoutRef.current) {
        window.clearTimeout(noticeTimeoutRef.current);
        noticeTimeoutRef.current = null;
      }
    };
  }, [notice]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('kivo_saved_conversations_v1');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSavedConversationIds(parsed.filter((item) => typeof item === 'string'));
      }
    } catch {
      // ignore malformed local state
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      'kivo_saved_conversations_v1',
      JSON.stringify(savedConversationIds),
    );
  }, [savedConversationIds]);

  useEffect(() => {
    setConversationDrawerOpen(false);
    setCreateOpen(false);
    setConnectorsOpen(false);
  }, [pathname]);

  const showNotice = (title: string, detail: string) => {
    setNotice({ title, detail });
  };

  const closeTransientUI = () => {
    setCreateOpen(false);
    setConnectorsOpen(false);
  };

  const focusComposer = () => {
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const toggleCreateMenu = () => {
    setConversationDrawerOpen(false);
    setConnectorsOpen(false);
    setCreateOpen((prev) => !prev);
  };

  const openWorkspace = () => {
    setConversationDrawerOpen(false);
    setCreateOpen(false);
    setConnectorsOpen(true);
  };

  const cleanupAttachments = (attachments: MessageAttachment[]) => {
    attachments.forEach((attachment) => {
      if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    });
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
      await sendMessage(draftPrompt.trim(), {
        attachments: composerAttachments,
      });

      setDraftPrompt('');
      cleanupAttachments(composerAttachments);
      setComposerAttachments([]);
      setCreateOpen(false);
      setConnectorsOpen(false);
      focusComposer();
    } finally {
      setIsSending(false);
    }
  };

  const ensureSpeechRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return null;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) return;

      setDraftPrompt((draftPrompt ? `${draftPrompt} ` : '') + transcript);
    };

    recognition.onerror = () => {
      setListening(false);
      showNotice(
        'Speech unavailable',
        'Microphone input could not be captured.',
      );
    };

    recognition.onend = () => setListening(false);

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
    cleanupAttachments(composerAttachments);
    setComposerAttachments([]);
    closeTransientUI();
    setConversationDrawerOpen(false);
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
    const nextAttachments = Array.from(files).map(toAttachment);
    if (!nextAttachments.length) return;

    setComposerAttachments((prev) => [...prev, ...nextAttachments]);

    showNotice(
      'Attachment added',
      nextAttachments.length === 1
        ? `${nextAttachments[0].name} is ready to send.`
        : `${nextAttachments.length} files are ready to send.`,
    );

    focusComposer();
  };

  const removeAttachment = (attachmentId: string) => {
    setComposerAttachments((prev) => {
      const target = prev.find((attachment) => attachment.id === attachmentId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((attachment) => attachment.id !== attachmentId);
    });
  };

  const openRouteFromSheet = (href: string) => {
    closeTransientUI();
    router.push(href);
  };

  const openFilePicker = (accept = '') => {
    setFilePickerAccept(accept);
    fileInputRef.current?.click();
  };

  const formatRelativeTime = (iso: string) => {
    const delta = Date.now() - new Date(iso).getTime();
    const minutes = Math.max(1, Math.floor(delta / 60000));
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  };

  const drawerRows = useMemo(() => {
    return conversationList
      .map((conversation) => {
        const threadMessages = messageState[conversation.id] ?? [];
        const draftValue = draftState[conversation.id] ?? '';
        const hasAgent = threadMessages.some(
          (message) =>
            message.agent || message.agentMetadata?.operatorModules?.length,
        );
        const lastMessage = threadMessages[threadMessages.length - 1];
        const unfinished =
          Boolean(draftValue.trim()) || lastMessage?.role === 'user';
        const running = lastMessage?.isStreaming;
        const saved = savedConversationIds.includes(conversation.id);

        return {
          id: conversation.id,
          title: conversation.title,
          preview: conversation.lastMessagePreview,
          timestamp: formatRelativeTime(conversation.updatedAt),
          badge: hasAgent
            ? running
              ? 'Running'
              : unfinished
                ? 'Needs Input'
                : 'Agent'
            : saved
              ? 'Saved'
              : unfinished
                ? 'Needs Input'
                : undefined,
          hasAgent,
          unfinished,
          isSaved: saved,
        };
      })
      .sort((a, b) => {
        const aConv = conversationList.find((item) => item.id === a.id);
        const bConv = conversationList.find((item) => item.id === b.id);
        return (
          new Date(bConv?.updatedAt ?? 0).getTime() -
          new Date(aConv?.updatedAt ?? 0).getTime()
        );
      });
  }, [conversationList, draftState, messageState, savedConversationIds]);

  const filteredRows = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    let rows = drawerRows;

    if (conversationFilter === 'recent') rows = rows.slice(0, 8);
    if (conversationFilter === 'agents')
      rows = rows.filter((row) => row.hasAgent);
    if (conversationFilter === 'saved')
      rows = rows.filter((row) => row.isSaved);
    if (conversationFilter === 'unfinished')
      rows = rows.filter((row) => row.unfinished);

    if (!query) return rows;

    return rows.filter((row) =>
      `${row.title} ${row.preview} ${row.badge ?? ''}`
        .toLowerCase()
        .includes(query),
    );
  }, [conversationFilter, conversationSearch, drawerRows]);

  const continueItem =
    filteredRows.find((row) => row.unfinished) ??
    drawerRows.find((row) => row.unfinished) ??
    null;

  const recentRows = filteredRows.slice(0, 12);
  const agentRows = filteredRows.filter((row) => row.hasAgent);
  const savedRows = filteredRows.filter((row) => row.isSaved);

  const handleCreateAction = (id: CreateActionId) => {
    setCreateOpen(false);

    switch (id) {
      case 'new-chat':
        createNewChat();
        return;
      case 'upload-image':
        openFilePicker('image/*');
        return;
      case 'upload-file':
        openFilePicker();
        return;
      case 'voice-input':
        toggleMic();
        return;
      case 'quick-action':
        setConnectorsOpen(true);
        return;
      case 'scan-receipt':
        showNotice('Coming soon', 'Receipt scanning is not available yet.');
        return;
      default:
        return;
    }
  };

  const handleConnectorAction = async (
    connector: string,
    mode: ConnectorMode,
  ) => {
    if (connector === 'gmail') {
      openRouteFromSheet('/control');
      showNotice('Gmail tools', 'Opened Gmail controls and sync options.');
      return;
    }

    if (connector === 'google-calendar') {
      openRouteFromSheet('/control');
      showNotice(
        'Calendar tools',
        'Opened planning and calendar connection controls.',
      );
      return;
    }

    if (connector === 'google-drive') {
      openRouteFromSheet('/control');
      showNotice('Drive tools', 'Opened Drive and document connection tools.');
      return;
    }

    if (connector === 'outlook') {
      openRouteFromSheet('/control');
      showNotice('Outlook settings', 'Opened Outlook management.');
      return;
    }

    if (connector === 'browser' && mode === 'connect') {
      openRouteFromSheet('/tools');
      showNotice(
        'Browser connected',
        'Research capture tools are now available.',
      );
      return;
    }

    if (connector === 'github' && mode === 'toggle') {
      showNotice('GitHub updated', 'Repository summaries were updated.');
      return;
    }

    showNotice(
      'Connector updated',
      `${connector.replace(/-/g, ' ')} is now ready.`,
    );
  };

  const handleToolSelect = (
    id:
      | 'finance-scanner'
      | 'memory-search'
      | 'research-mode'
      | 'compare-tool'
      | 'automation-builder',
  ) => {
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
  };

  const handleRecentSelect = (
    id: 'gmail-sync' | 'subscription-scan' | 'weekly-planner',
  ) => {
    if (id === 'gmail-sync') {
      openRouteFromSheet('/control');
      return;
    }

    if (id === 'subscription-scan') {
      openRouteFromSheet('/money-saver');
      return;
    }

    openRouteFromSheet('/actions?type=planner');
  };

  return (
    <AppShell>
      <div className="relative flex h-[100dvh] min-h-0 flex-col overflow-hidden">
        <ChatHeader
          onOpenConversations={() => {
            setConnectorsOpen(false);
            setCreateOpen(false);
            setConversationDrawerOpen(true);
          }}
        />

        <div className="relative flex min-h-0 flex-1 flex-col">
          <MessageThread
            messages={messages}
            pending={isAgentResponding}
          />

          <Composer
            value={draftPrompt}
            isSending={isSending}
            listening={listening}
            createOpen={createOpen}
            attachments={composerAttachments}
            onChange={setDraftPrompt}
            onSend={() => void handleSend()}
            onOpenCreate={toggleCreateMenu}
            onOpenTools={openWorkspace}
            onToggleMic={toggleMic}
            onRemoveAttachment={removeAttachment}
            inputRef={inputRef}
          />

          <BottomActionSheet
            open={createOpen}
            title="Add to chat"
            items={PLUS_ACTIONS}
            onClose={() => setCreateOpen(false)}
            onSelect={(id) => handleCreateAction(id as CreateActionId)}
          />

          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            accept={filePickerAccept}
            multiple
            onChange={(event) => {
              if (event.target.files?.length) {
                addAttachments(event.target.files);
              }
              event.target.value = '';
              setFilePickerAccept('');
            }}
          />

          <WorkspaceSheet
            open={connectorsOpen}
            onClose={() => setConnectorsOpen(false)}
            onQuickAction={(id) => {
              if (id === 'ask-agent') {
                setConnectorsOpen(false);
                focusComposer();
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
            onConnectorAction={(connector, mode) =>
              void handleConnectorAction(connector, mode)
            }
            onToolSelect={handleToolSelect}
            onRecentSelect={handleRecentSelect}
          />

          <ConversationDrawer
            open={conversationDrawerOpen}
            onClose={() => setConversationDrawerOpen(false)}
            search={conversationSearch}
            onSearchChange={setConversationSearch}
            filter={conversationFilter}
            onFilterChange={setConversationFilter}
            continueItem={continueItem}
            recentRows={recentRows}
            agentRows={agentRows}
            savedRows={savedRows}
            onOpenConversation={(conversationId) => {
              openConversation(conversationId);
              setConversationDrawerOpen(false);
            }}
            onToggleSaved={(conversationId) => {
              setSavedConversationIds((prev) =>
                prev.includes(conversationId)
                  ? prev.filter((id) => id !== conversationId)
                  : [conversationId, ...prev],
              );
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
            <p className="text-sm font-medium text-[#505865]">
              {notice?.title ?? 'Message issue'}
            </p>
            <p className="text-xs text-[#7d8593]">
              {notice?.detail ?? streamError}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AppShell>
  );
}
