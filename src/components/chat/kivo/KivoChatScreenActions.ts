import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { useAppStore } from '@/app/store/app-store';
import type { MessageAttachment } from '@/app/store/app-store';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { buildAttachment, cleanupAttachments } from './KivoChatScreenHooks';

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

type Params = {
  userId?: string;
  router: AppRouterInstance;
  pathname: string;
  searchParams: URLSearchParams;
  draftPrompt: string;
  setDraftPrompt: (value: string) => void;
  sendMessage: (content: string, options?: { attachments?: MessageAttachment[] }) => Promise<void>;
  createConversation: () => string;
  openConversation: (id: string) => void;
  isAgentResponding: boolean;
  focusComposer: () => void;
  showNotice: (title: string, detail: string) => void;
};

export function useKivoChatScreenActions({
  userId,
  router,
  pathname,
  searchParams,
  draftPrompt,
  setDraftPrompt,
  sendMessage,
  createConversation,
  openConversation,
  isAgentResponding,
  focusComposer,
  showNotice,
}: Params) {
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [filePickerAccept, setFilePickerAccept] = useState('');
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  const closeWorkspace = useCallback(() => setWorkspaceOpen(false), []);
  const closeActionSheet = useCallback(() => setActionSheetOpen(false), []);

  useEffect(() => {
    return () => cleanupAttachments(attachments);
  }, [attachments]);

  useEffect(() => {
    setWorkspaceOpen(false);
    setActionSheetOpen(false);
  }, [pathname]);

  const refreshIntegrationStatuses = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!actionSheetOpen) return;
    void refreshIntegrationStatuses();
  }, [actionSheetOpen, refreshIntegrationStatuses]);

  useEffect(() => {
    const calendarParam = searchParams.get('calendar');
    const connectedParam = searchParams.get('connected');
    if (!calendarParam && connectedParam !== '1') return;

    void refreshIntegrationStatuses();

    if (calendarParam === 'connected' || connectedParam === '1') {
      showNotice('Google Calendar connected', 'Calendar tools are now ready to use.');
    } else if (calendarParam === 'error') {
      const reason = searchParams.get('reason');
      const detail = reason
        ? `Could not connect Google Calendar (${reason}).`
        : 'Could not connect Google Calendar.';
      showNotice('Could not connect Google Calendar', detail);
    }

    const cleanedParams = new URLSearchParams(searchParams.toString());
    cleanedParams.delete('calendar');
    cleanedParams.delete('connected');
    cleanedParams.delete('reason');
    cleanedParams.delete('step');
    const suffix = cleanedParams.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  }, [pathname, refreshIntegrationStatuses, router, searchParams, showNotice]);

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
    closeActionSheet,
    closeWorkspace,
    createConversation,
    focusComposer,
    openConversation,
    router,
    setDraftPrompt,
  ]);

  const addAttachments = useCallback(
    (files: FileList | File[]) => {
      const next = Array.from(files).map(buildAttachment);
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
    [focusComposer, showNotice],
  );

  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === attachmentId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== attachmentId);
    });
  }, []);

  const openFilePicker = useCallback((accept = '') => {
    setFilePickerAccept(accept);
  }, []);

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

  const handleHeaderSummarize = useCallback(() => {
    setDraftPrompt(
      'Summarize this conversation into a concise recap with key decisions, next steps, and open questions.',
    );
    focusComposer();
    closeWorkspace();
    closeActionSheet();
    showNotice('Summary ready', 'Review and send the summary prompt.');
  }, [closeActionSheet, closeWorkspace, focusComposer, setDraftPrompt, showNotice]);

  const handleHeaderCreateTask = useCallback(() => {
    setDraftPrompt(
      'Turn this conversation into an actionable task list with priorities, deadlines, and the next step I should do first.',
    );
    focusComposer();
    closeWorkspace();
    closeActionSheet();
    showNotice('Task prompt ready', 'Review and send to generate tasks.');
  }, [closeActionSheet, closeWorkspace, focusComposer, setDraftPrompt, showNotice]);

  const handleActionTool = useCallback(
    (id: ProductivityToolId) => {
      if (id === 'gmail') {
        if (!gmailConnected) return void window.location.assign('/api/integrations/gmail/connect');
        return void openOperatorRoute('/actions?tool=gmail');
      }
      if (id === 'calendar') {
        if (!calendarConnected) {
          return void window.location.assign('/api/integrations/google-calendar/connect');
        }
        return void openOperatorRoute('/actions?tool=google-calendar');
      }
      if (id === 'money-saver') return void openOperatorRoute('/money-saver');
      openOperatorRoute('/tasks');
    },
    [calendarConnected, gmailConnected, openOperatorRoute],
  );

  const handleSend = useCallback(async () => {
    const canSend = draftPrompt.trim().length > 0 || attachments.length > 0;
    const isBusy = isSending || isAgentResponding;
    if (!canSend || isBusy) return;
    if (!userId) {
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
    closeActionSheet,
    closeWorkspace,
    draftPrompt,
    focusComposer,
    isAgentResponding,
    isSending,
    router,
    sendMessage,
    setDraftPrompt,
    showNotice,
    userId,
  ]);

  const handleQuickAction = useCallback(
    (id: WorkspaceQuickActionId) => {
      if (id === 'ask-agent') {
        closeWorkspace();
        focusComposer();
        return;
      }
      if (id === 'analyze') return void openOperatorRoute('/analyze');
      if (id === 'planner') return void openOperatorRoute('/actions?type=planner');
      openOperatorRoute('/money-saver');
    },
    [closeWorkspace, focusComposer, openOperatorRoute],
  );

  const handleConnectorAction = useCallback(
    (connector: string, mode: ConnectorMode) => {
      const requireAuthThenOpen = (path: string) => {
        if (!userId) return void router.push('/login?next=/chat');
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
        }
      };

      if (connector === 'gmail') {
        if (mode === 'connect') return void requireAuthThenOpen('/api/integrations/gmail/connect');
        if (mode === 'toggle') return void disconnect('gmail');
        if (mode === 'connected' || mode === 'manage') return void openOperatorRoute('/actions?tool=gmail');
      }
      if (connector === 'google-calendar') {
        if (mode === 'connect') return void requireAuthThenOpen('/api/integrations/google-calendar/connect');
        if (mode === 'toggle') return void disconnect('google-calendar');
        if (mode === 'connected' || mode === 'manage') {
          return void openOperatorRoute('/actions?tool=google-calendar');
        }
      }
      if (connector === 'browser') {
        if (!userId) return void router.push('/login?next=/tools?tool=browser-search');
        if (mode === 'connect' || mode === 'connected' || mode === 'manage') {
          return void openOperatorRoute('/tools?tool=browser-search');
        }
        if (mode === 'toggle') {
          showNotice('Browser Search disabled', 'You can enable it again any time.');
          return;
        }
      }
      if (connector === 'google-drive') return void openOperatorRoute('/tools?source=drive');
      if (connector === 'outlook') return void openOperatorRoute('/tools');
      if (connector === 'github') return void openOperatorRoute('/agents');
      openOperatorRoute('/tools');
    },
    [openOperatorRoute, router, showNotice, userId],
  );

  const handleToolSelect = useCallback(
    (id: WorkspaceToolId) => {
      if (id === 'finance-scanner') return void openOperatorRoute('/money');
      if (id === 'memory-search') return void openOperatorRoute('/memory');
      if (id === 'research-mode') return void openOperatorRoute('/agents');
      if (id === 'compare-tool') return void openOperatorRoute('/actions');
      openOperatorRoute('/tools');
    },
    [openOperatorRoute],
  );

  const handleRecentSelect = useCallback(
    (id: WorkspaceRecentId) => {
      if (id === 'gmail-sync' || id === 'subscription-scan') {
        return void openOperatorRoute('/actions?tool=gmail');
      }
      openOperatorRoute('/actions?type=planner');
    },
    [openOperatorRoute],
  );

  const handleSidebarSearch = useCallback(() => {
    setDraftPrompt('Help me find this in my chats, tools, or memory: ');
    focusComposer();
    showNotice('Search ready', 'Type what you want to find.');
  }, [focusComposer, setDraftPrompt, showNotice]);

  const handleOpenChatFromSidebar = useCallback(
    (conversationId: string) => {
      openConversation(conversationId);
      router.push('/chat');
    },
    [openConversation, router],
  );

  const onHiddenFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      addAttachments(event.target.files ?? []);
      event.currentTarget.value = '';
      setFilePickerAccept('');
    },
    [addAttachments],
  );

  const onQuickTask = useCallback(() => {
    setDraftPrompt('Help me complete this task quickly: ');
    focusComposer();
  }, [focusComposer, setDraftPrompt]);

  return {
    attachments,
    filePickerAccept,
    workspaceOpen,
    actionSheetOpen,
    isSending,
    gmailConnected,
    calendarConnected,
    setWorkspaceOpen,
    setActionSheetOpen,
    closeWorkspace,
    closeActionSheet,
    handleSend,
    createNewChat,
    openFilePicker,
    removeAttachment,
    handlePasteLink,
    handleAiAction,
    handleHeaderSummarize,
    handleHeaderCreateTask,
    handleQuickAction,
    handleActionTool,
    handleConnectorAction,
    handleToolSelect,
    handleRecentSelect,
    handleSidebarSearch,
    handleOpenChatFromSidebar,
    onHiddenFileInputChange,
    onQuickTask,
    openOperatorRoute,
  };
}
