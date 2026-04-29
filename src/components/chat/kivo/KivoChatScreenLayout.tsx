import type { CSSProperties } from 'react';
import { WorkspaceSheet } from '@/components/chat/WorkspaceSheet';
import { KivoActionSheet } from './KivoActionSheet';
import { KivoChatScreenAttachmentTray } from './KivoChatScreenAttachmentTray';
import KivoChatHeader from './KivoChatHeader';
import { KivoChatScreenMainContent } from './KivoChatScreenMainContent';
import { KivoChatScreenNoticeToast } from './KivoChatScreenNoticeToast';
import { KivoChatScreenScrollToLatestButton } from './KivoChatScreenScrollToLatestButton';
import { KivoComposerDock } from './KivoComposerDock';
import { KivoChatSidebarArea, KIVO_CHAT_SIDEBAR_RAIL_WIDTH } from './KivoChatSidebarArea';
import { KivoReferralSuccessToast } from './KivoReferralSuccessToast';
import { KivoFloatingTaskLayer } from './live-steps/KivoFloatingTaskLayer';

const SIDEBAR_GAP = 12;
type Props = any;

export function KivoChatScreenLayout(props: Props) {
  const {
    userName, hasMessages, sidebarRecentChats, showSidebarRail, setShowSidebarRail, isSidebarOpen, setIsSidebarOpen,
    createNewChat, handleSidebarSearch, handleOpenChatFromSidebar, onOpenSettings, onQuickTask, onAnalyzeFile, onPlanMyDay,
    onOpenGmail, onOpenCalendar, onOpenDrive, onOpenWeb, onUpgrade, handleHeaderSummarize, handleHeaderCreateTask,
    mainScrollRef, scrollBottomPadding, streamError, refinedStreamError, isAgentResponding, isSending, messages,
    lastMessageSafetySpacer, showScrollToLatest, latestButtonBottom, onScrollToLatest, attachments, keyboardOffset,
    attachmentTrayRef, removeAttachment, notice, draftPrompt, setDraftPrompt, handleSend, setActionSheetOpen, setWorkspaceOpen,
    toggleMic, canSend, isListening, isBusy, placeholder, composerDockRef, referralToastOpen, referralToastTitle,
    referralToastDetail, setReferralToastOpen, actionSheetOpen, gmailConnected, calendarConnected, closeActionSheet,
    openFilePicker, handlePasteLink, handleAiAction, handleActionTool, workspaceOpen, closeWorkspace, handleQuickAction,
    handleConnectorAction, handleToolSelect, handleRecentSelect, fileInputRef, filePickerAccept, onHiddenFileInputChange,
    floatingRunningTask,
  } = props;

  const sidebarWidth = showSidebarRail ? KIVO_CHAT_SIDEBAR_RAIL_WIDTH : 0;
  const contentLeftOffset = sidebarWidth ? sidebarWidth + SIDEBAR_GAP : 0;
  const composerLeftOffset = sidebarWidth ? sidebarWidth + SIDEBAR_GAP : 12;

  const handleSidebarToggle = () => {
    if (showSidebarRail) { setShowSidebarRail(false); setIsSidebarOpen(false); return; }
    setShowSidebarRail(true); setIsSidebarOpen(false);
  };

  const handleComposerFocus = () => {
    setTimeout(() => {
      const el = mainScrollRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, 180);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-b from-[#f7f7f5] via-[#f5f5f3] to-[#f2f2f0] text-[#2f3640]">
      {showSidebarRail ? <KivoChatSidebarArea panelOpen={isSidebarOpen} onPanelOpenChange={setIsSidebarOpen} hasMessages={hasMessages} userName={userName} plan="free" recentChats={sidebarRecentChats} onNewChat={createNewChat} onSearch={handleSidebarSearch} onOpenChat={handleOpenChatFromSidebar} onOpenSettings={onOpenSettings} onQuickTask={onQuickTask} onAnalyzeFile={onAnalyzeFile} onPlanMyDay={onPlanMyDay} onOpenGmail={onOpenGmail} onOpenCalendar={onOpenCalendar} onOpenDrive={onOpenDrive} onOpenWeb={onOpenWeb} onUpgrade={onUpgrade} /> : null}
      <div className="relative h-full transition-[padding-left] duration-300 ease-out" style={{ paddingLeft: `${contentLeftOffset}px` }}>
        <div className="mx-auto flex h-full w-full max-w-[560px] flex-col">
          <div className="sticky top-0 z-20 shrink-0 bg-[#f7f7f5]/90 backdrop-blur-xl">
            <KivoChatHeader hasMessages={hasMessages} isSidebarOpen={showSidebarRail} onSidebarToggle={handleSidebarToggle} onSummarize={handleHeaderSummarize} onCreateTask={handleHeaderCreateTask} />
          </div>
          <KivoChatScreenMainContent mainScrollRef={mainScrollRef} scrollBottomPadding={scrollBottomPadding} streamError={streamError} refinedStreamError={refinedStreamError} hasMessages={hasMessages} isAgentResponding={isAgentResponding} isSending={isSending} messages={messages} lastMessageSafetySpacer={lastMessageSafetySpacer} />
          <KivoChatScreenScrollToLatestButton show={showScrollToLatest} bottom={latestButtonBottom} onClick={onScrollToLatest} />
          <KivoChatScreenAttachmentTray attachments={attachments} keyboardOffset={keyboardOffset} attachmentTrayRef={attachmentTrayRef} onRemoveAttachment={removeAttachment} />
          <KivoChatScreenNoticeToast notice={notice} />
          <KivoFloatingTaskLayer floatingRunningTask={floatingRunningTask} composerLeftOffset={composerLeftOffset} keyboardOffset={keyboardOffset} />
          <div className="[&>div]:!left-[var(--kivo-composer-left)] [&>div]:!right-3 [&>div]:!mx-0 [&>div]:!w-auto [&>div]:!max-w-none [&>div]:transition-[left,right,transform] [&>div]:duration-300 [&>div]:ease-out" style={{ ['--kivo-composer-left' as string]: `${composerLeftOffset}px` } as CSSProperties}>
            <KivoComposerDock value={draftPrompt} onChange={setDraftPrompt} onSend={handleSend} onPlusClick={() => setActionSheetOpen(true)} onQuickActionClick={() => setWorkspaceOpen(true)} onMicClick={toggleMic} canSend={canSend} isListening={isListening} isSending={isBusy} placeholder={placeholder} keyboardOffset={keyboardOffset} containerRef={composerDockRef} desktopShiftX={0} onFocus={handleComposerFocus} />
          </div>
          <KivoReferralSuccessToast open={referralToastOpen} title={referralToastTitle} detail={referralToastDetail} onClose={() => setReferralToastOpen(false)} />
          <KivoActionSheet open={actionSheetOpen} isListening={isListening} attachments={attachments} toolState={{ gmail: { connected: gmailConnected, subtitle: 'Inbox summary, urgent emails, subscriptions' }, calendar: { connected: calendarConnected, subtitle: 'Today plan, reminders, free time' }, 'money-saver': { connected: true, subtitle: 'Find leaks, subscriptions, savings' }, tasks: { connected: true, subtitle: 'Notes, todos, action items' } }} onClose={closeActionSheet} onAddImages={() => openFilePicker('image/*')} onAddFiles={() => openFilePicker()} onPasteLink={handlePasteLink} onVoiceInput={toggleMic} onAiAction={handleAiAction} onToolAction={handleActionTool} />
          <WorkspaceSheet open={workspaceOpen} onClose={closeWorkspace} onQuickAction={handleQuickAction} onConnectorAction={handleConnectorAction} onToolSelect={handleToolSelect} onRecentSelect={handleRecentSelect} />
          <input ref={fileInputRef} data-kivo-file-picker="true" type="file" multiple accept={filePickerAccept} className="hidden" onChange={onHiddenFileInputChange} />
        </div>
      </div>
    </div>
  );
}
