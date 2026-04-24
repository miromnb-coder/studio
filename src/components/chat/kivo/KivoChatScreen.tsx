'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/app/store/app-store';
import { type KivoSidebarRecentChat } from './KivoSidebar';
import { KivoChatScreenLayout } from './KivoChatScreenLayout';
import {
  type KivoChatNotice,
  useKivoChatScreenHooks,
  useSidebarAutoToggle,
} from './KivoChatScreenHooks';
import { useKivoChatScreenActions } from './KivoChatScreenActions';

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

  const [notice, setNotice] = useState<KivoChatNotice | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => messages.length === 0);
  const [referralToastOpen, setReferralToastOpen] = useState(false);
  const [referralToastTitle, setReferralToastTitle] = useState('');
  const [referralToastDetail, setReferralToastDetail] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasMessages = messages.length > 0;
  const showSidebarRail = !hasMessages || isSidebarOpen;

  useSidebarAutoToggle(hasMessages, setIsSidebarOpen);

  const showNotice = useCallback((title: string, detail: string) => {
    setNotice({ title, detail });
  }, []);

  const focusComposer = useCallback(() => {
    requestAnimationFrame(() => {
      const textarea = document.getElementById(
        'kivo-composer-textarea',
      ) as HTMLTextAreaElement | null;
      textarea?.focus();
    });
  }, []);

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
    focusComposer,
    showNotice,
  });

  const hasAttachments = actions.attachments.length > 0;
  const canSend = draftPrompt.trim().length > 0 || hasAttachments;
  const isBusy = actions.isSending || isAgentResponding;

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
    notice,
    setNotice,
    setDraftPrompt,
    showNotice,
    focusComposer,
  });

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

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

  const placeholder = useMemo(() => {
    if (hasAttachments && !draftPrompt.trim()) {
      return 'Add a message or send attachments';
    }
    return 'Assign a task or ask anything';
  }, [hasAttachments, draftPrompt]);

  const refinedStreamError = useMemo(() => {
    const raw = (streamError || '').trim();
    if (!raw) return '';
    if (raw.startsWith('AUTH_REQUIRED:')) return 'Please sign in to continue.';
    if (raw.toLowerCase().includes('gmail')) return 'Could not access Gmail right now.';
    if (raw.toLowerCase().includes('calendar')) return 'Calendar is unavailable right now.';
    return 'Something went wrong. Please try again.';
  }, [streamError]);

  const sidebarRecentChats = useMemo<KivoSidebarRecentChat[]>(() => {
    if (!activeConversationId) return [];

    const firstUserMessage = messages.find(
      (message) => message.role === 'user' && message.content.trim().length > 0,
    );
    const lastMessage = messages[messages.length - 1];

    return [
      {
        id: activeConversationId,
        title:
          firstUserMessage?.content.trim().slice(0, 42) ||
          (hasMessages ? 'Current conversation' : 'New conversation'),
        preview: lastMessage?.content?.trim().slice(0, 72) || 'Continue working',
        timestamp: hasMessages ? 'Now' : '',
      },
    ];
  }, [activeConversationId, hasMessages, messages]);

  return (
    <KivoChatScreenLayout
      userName={user?.name || 'Miro'}
      hasMessages={hasMessages}
      sidebarRecentChats={sidebarRecentChats}
      isSidebarOpen={isSidebarOpen}
      showSidebarRail={showSidebarRail}
      setIsSidebarOpen={setIsSidebarOpen}
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
      onScrollToLatest={() => {
        hooks.scrollToLatest('smooth');
        requestAnimationFrame(() => hooks.updateScrollState());
      }}
      attachments={actions.attachments}
      keyboardOffset={hooks.keyboardOffset}
      attachmentTrayRef={hooks.attachmentTrayRef}
      removeAttachment={actions.removeAttachment}
      notice={notice}
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
      openFilePicker={(accept) => {
        actions.openFilePicker(accept);
        fileInputRef.current?.click();
      }}
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
    />
  );
}

export default KivoChatScreen;
