'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/app/store/app-store';
import { type KivoSidebarRecentChat } from './KivoSidebar';
import { KivoChatScreenLayout } from './KivoChatScreenLayout';
import { useKivoChatScreenHooks } from './KivoChatScreenHooks';
import { useKivoChatScreenActions } from './KivoChatScreenActions';
import { haptic } from '@/lib/haptics';
import { mapRunningTask } from './live-steps/running-task-mapper';
import { mapStreamEventsToLiveSteps } from './live-steps/live-steps-mapper';
import type { LiveStepContext, LiveStepStreamEvent } from './live-steps/live-steps-types';

export type KivoConnectedService = {
  id: 'gmail' | 'calendar' | 'drive' | 'github' | 'web' | 'outlook';
  label: string;
};

function safeRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asEvents(value: unknown): LiveStepStreamEvent[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === 'object').map((item) => item as LiveStepStreamEvent).filter((item) => typeof item.type === 'string');
}

function extractEvents(message: unknown): LiveStepStreamEvent[] {
  const record = safeRecord(message);
  const metadata = safeRecord(record?.agentMetadata);
  const structured = safeRecord(record?.structuredData) || safeRecord(metadata?.structuredData);
  const liveSteps = safeRecord(structured?.liveSteps);
  return asEvents(liveSteps?.events);
}

function readLiveStepContext(message: unknown, latestUserContent: string): LiveStepContext {
  const record = safeRecord(message);
  const metadata = safeRecord(record?.agentMetadata);
  const structured = safeRecord(record?.structuredData) || safeRecord(metadata?.structuredData);
  const liveSteps = safeRecord(structured?.liveSteps);
  const toolsUsed = Array.isArray(structured?.toolsUsed) ? structured.toolsUsed as string[] : undefined;
  const startedAt = typeof liveSteps?.startedAt === 'number' ? liveSteps.startedAt : undefined;
  const content = typeof record?.content === 'string' ? record.content : '';
  return {
    isStreaming: record?.isStreaming === true,
    elapsedMs: startedAt ? Date.now() - startedAt : undefined,
    reasoningDepth: typeof structured?.reasoningDepth === 'string' ? structured.reasoningDepth : undefined,
    toolsUsed,
    memoryUsed: metadata?.memoryUsed === true,
    taskDepth: typeof structured?.taskDepth === 'string' ? structured.taskDepth as LiveStepContext['taskDepth'] : undefined,
    mode: typeof metadata?.mode === 'string' ? metadata.mode : 'agent',
    contentLength: content.trim().length,
    latestUserContent,
  };
}

export function KivoChatScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const [showSidebarRail, setShowSidebarRail] = useState(false);
  const [referralToastOpen, setReferralToastOpen] = useState(false);
  const [referralToastTitle, setReferralToastTitle] = useState('');
  const [referralToastDetail, setReferralToastDetail] = useState('');
  const [localConnectedServices, setLocalConnectedServices] = useState<KivoConnectedService[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wasRespondingRef = useRef(false);
  const hasMessages = messages.length > 0;
  const disabledNotice = null;
  const disableNotice = useCallback(() => {}, []);

  const actions = useKivoChatScreenActions({
    userId: user?.id,
    router,
    pathname,
    searchParams: new URLSearchParams(searchParams.toString()),
    draftPrompt,
    setDraftPrompt,
    sendMessage,
    createConversation,
    openConversation,
    isAgentResponding,
    focusComposer: () => {
      requestAnimationFrame(() => {
        const textarea = document.getElementById('kivo-composer-textarea') as HTMLTextAreaElement | null;
        textarea?.focus();
      });
    },
    showNotice: disableNotice,
  });

  useEffect(() => { if (!hydrated) hydrate(); }, [hydrate, hydrated]);
  useEffect(() => { if (hasMessages) setShowSidebarRail(false); }, [hasMessages]);
  useEffect(() => {
    if (!wasRespondingRef.current && isAgentResponding) { wasRespondingRef.current = true; return; }
    if (wasRespondingRef.current && !isAgentResponding) {
      if (streamError?.trim()) haptic.error(); else haptic.success();
      wasRespondingRef.current = false;
    }
  }, [isAgentResponding, streamError]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const readEnabled = (keys: string[]) => keys.some((key) => window.localStorage.getItem(key) === 'true');
    const services: KivoConnectedService[] = [];
    if (actions.gmailConnected || readEnabled(['kivo_gmail_enabled', 'gmailConnected'])) services.push({ id: 'gmail', label: 'Gmail' });
    if (actions.calendarConnected || readEnabled(['kivo_calendar_enabled', 'calendarConnected'])) services.push({ id: 'calendar', label: 'Calendar' });
    if (readEnabled(['kivo_drive_enabled', 'driveConnected'])) services.push({ id: 'drive', label: 'Drive' });
    if (readEnabled(['kivo_github_enabled', 'githubConnected'])) services.push({ id: 'github', label: 'GitHub' });
    if (readEnabled(['kivo_browser_search_enabled', 'browserSearchConnected'])) services.push({ id: 'web', label: 'Web' });
    if (readEnabled(['kivo_outlook_enabled', 'outlookConnected'])) services.push({ id: 'outlook', label: 'Outlook' });
    setLocalConnectedServices(services);
  }, [actions.gmailConnected, actions.calendarConnected]);

  const hasAttachments = actions.attachments.length > 0;
  const canSend = draftPrompt.trim().length > 0 || hasAttachments;
  const isBusy = actions.isSending || isAgentResponding;
  const placeholder = useMemo(() => hasAttachments && !draftPrompt.trim() ? 'Add a message or send attachments' : 'Assign a task or ask anything', [hasAttachments, draftPrompt]);
  const refinedStreamError = useMemo(() => {
    const raw = (streamError || '').trim();
    if (!raw) return '';
    if (raw.startsWith('AUTH_REQUIRED:')) return 'Please sign in to continue.';
    if (raw.toLowerCase().includes('gmail')) return 'Could not access Gmail right now.';
    if (raw.toLowerCase().includes('calendar')) return 'Calendar is unavailable right now.';
    return 'Something went wrong. Please try again.';
  }, [streamError]);
  const lastMessageKey = useMemo(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return 'empty';
    return `${lastMessage.id}:${lastMessage.content.length}:${lastMessage.isStreaming ? 's' : 'f'}:${messages.length}`;
  }, [messages]);

  const hooks = useKivoChatScreenHooks({
    activeConversationId,
    hasMessages,
    messagesLength: messages.length,
    messagesLastRole: messages[messages.length - 1]?.role,
    lastMessageKey,
    isAgentResponding,
    isSending: actions.isSending,
    attachmentsLength: actions.attachments.length,
    draftPrompt,
    notice: disabledNotice,
    setNotice: disableNotice,
    setDraftPrompt,
    showNotice: disableNotice,
    focusComposer: () => requestAnimationFrame(() => (document.getElementById('kivo-composer-textarea') as HTMLTextAreaElement | null)?.focus()),
  });

  const latestUserContent = useMemo(() => [...messages].reverse().find((message) => message.role === 'user')?.content || '', [messages]);
  const floatingRunningTaskData = useMemo(() => {
    const assistant = [...messages].reverse().find((message) => message.role === 'assistant');
    if (!assistant) return null;
    const events = extractEvents(assistant);
    const context = readLiveStepContext(assistant, latestUserContent);
    const task = mapRunningTask(events, context);
    if (!task) return null;
    return { task, steps: mapStreamEventsToLiveSteps(events) };
  }, [messages, latestUserContent]);

  const sidebarRecentChats = useMemo<KivoSidebarRecentChat[]>((() => {
    if (!activeConversationId) return [];
    const firstUserMessage = messages.find((message) => message.role === 'user' && message.content.trim().length > 0);
    const lastMessage = messages[messages.length - 1];
    return [{ id: activeConversationId, title: firstUserMessage?.content.trim().slice(0, 42) || (hasMessages ? 'Current conversation' : 'New conversation'), preview: lastMessage?.content?.trim().slice(0, 72) || 'Continue working', timestamp: hasMessages ? 'Now' : '' }];
  }), [activeConversationId, hasMessages, messages]);

  return (
    <KivoChatScreenLayout
      userName={user?.name || 'Miro'}
      hasMessages={hasMessages}
      connectedServices={localConnectedServices}
      sidebarRecentChats={sidebarRecentChats}
      showSidebarRail={showSidebarRail}
      setShowSidebarRail={setShowSidebarRail}
      isSidebarOpen={false}
      setIsSidebarOpen={() => {}}
      createNewChat={actions.createNewChat}
      handleSidebarSearch={actions.handleSidebarSearch}
      handleOpenChatFromSidebar={actions.handleOpenChatFromSidebar}
      onOpenSettings={() => router.push('/settings')}
      onQuickTask={actions.onQuickTask}
      onAnalyzeFile={() => actions.openOperatorRoute('/analyze')}
      onPlanMyDay={() => actions.openOperatorRoute('/actions?type=planner')}
      onOpenGmail={() => actions.handleActionTool('gmail')}
      onOpenCalendar={() => actions.handleActionTool('calendar')}
      onOpenDrive={() => actions.openOperatorRoute('/tools?source=drive')}
      onOpenWeb={() => actions.openOperatorRoute('/tools?tool=browser-search')}
      onUpgrade={() => router.push('/upgrade')}
      handleHeaderSummarize={actions.handleHeaderSummarize}
      handleHeaderCreateTask={actions.handleHeaderCreateTask}
      mainScrollRef={hooks.mainScrollRef}
      scrollBottomPadding={hooks.scrollBottomPadding}
      streamError={streamError}
      refinedStreamError={refinedStreamError}
      isAgentResponding={isAgentResponding}
      isSending={actions.isSending}
      messages={messages}
      lastMessageSafetySpacer={hooks.lastMessageSafetySpacer}
      showScrollToLatest={hooks.showScrollToLatest}
      latestButtonBottom={hooks.latestButtonBottom}
      onScrollToLatest={() => { hooks.scrollToLatest('smooth'); requestAnimationFrame(() => hooks.updateScrollState()); }}
      attachments={actions.attachments}
      keyboardOffset={hooks.keyboardOffset}
      attachmentTrayRef={hooks.attachmentTrayRef}
      removeAttachment={actions.removeAttachment}
      notice={disabledNotice}
      draftPrompt={draftPrompt}
      setDraftPrompt={setDraftPrompt}
      handleSend={actions.handleSend}
      setActionSheetOpen={actions.setActionSheetOpen}
      setWorkspaceOpen={actions.setWorkspaceOpen}
      toggleMic={hooks.toggleMic}
      canSend={canSend}
      isListening={hooks.isListening}
      isBusy={isBusy}
      placeholder={placeholder}
      composerDockRef={hooks.composerDockRef}
      referralToastOpen={referralToastOpen}
      referralToastTitle={referralToastTitle}
      referralToastDetail={referralToastDetail}
      setReferralToastOpen={setReferralToastOpen}
      actionSheetOpen={actions.actionSheetOpen}
      gmailConnected={actions.gmailConnected}
      calendarConnected={actions.calendarConnected}
      closeActionSheet={actions.closeActionSheet}
      openFilePicker={(accept) => { actions.openFilePicker(accept); fileInputRef.current?.click(); }}
      handlePasteLink={actions.handlePasteLink}
      handleAiAction={actions.handleAiAction}
      handleActionTool={actions.handleActionTool}
      workspaceOpen={actions.workspaceOpen}
      closeWorkspace={actions.closeWorkspace}
      handleQuickAction={actions.handleQuickAction}
      handleConnectorAction={actions.handleConnectorAction}
      handleToolSelect={actions.handleToolSelect}
      handleRecentSelect={actions.handleRecentSelect}
      fileInputRef={fileInputRef}
      filePickerAccept={actions.filePickerAccept}
      onHiddenFileInputChange={actions.onHiddenFileInputChange}
      floatingRunningTask={floatingRunningTaskData}
    />
  );
}

export default KivoChatScreen;
