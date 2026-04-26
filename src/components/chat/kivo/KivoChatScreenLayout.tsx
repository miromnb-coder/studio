import type { CSSProperties, ChangeEvent, Dispatch, RefObject, SetStateAction } from 'react';
import type { MessageAttachment } from '@/app/store/app-store';
import type { Message } from '@/app/store/app-store-types';
import { WorkspaceSheet } from '@/components/chat/WorkspaceSheet';
import { KivoActionSheet } from './KivoActionSheet';
import { KivoChatScreenAttachmentTray } from './KivoChatScreenAttachmentTray';
import KivoChatHeader from './KivoChatHeader';
import { KivoChatScreenMainContent } from './KivoChatScreenMainContent';
import { KivoChatScreenNoticeToast, type KivoChatNotice } from './KivoChatScreenNoticeToast';
import { KivoChatScreenScrollToLatestButton } from './KivoChatScreenScrollToLatestButton';
import { KivoComposerDock } from './KivoComposerDock';
import { KivoChatSidebarArea, KIVO_CHAT_SIDEBAR_RAIL_WIDTH } from './KivoChatSidebarArea';
import { KivoReferralSuccessToast } from './KivoReferralSuccessToast';
import { type KivoSidebarRecentChat } from './KivoSidebar';

const SIDEBAR_GAP = 12;
type KivoNotice = KivoChatNotice;

type Props = {
  userName: string; hasMessages: boolean; sidebarRecentChats: KivoSidebarRecentChat[];
  showSidebarRail: boolean; setShowSidebarRail: Dispatch<SetStateAction<boolean>>; isSidebarOpen: boolean; setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  createNewChat: () => void; handleSidebarSearch: () => void; handleOpenChatFromSidebar: (conversationId: string) => void; onOpenSettings: () => void; onQuickTask: () => void; onAnalyzeFile: () => void; onPlanMyDay: () => void; onOpenGmail: () => void; onOpenCalendar: () => void; onOpenDrive: () => void; onOpenWeb: () => void; onUpgrade: () => void; handleHeaderSummarize: () => void; handleHeaderCreateTask: () => void;
  mainScrollRef: RefObject<HTMLDivElement | null>; scrollBottomPadding: number; streamError: string; refinedStreamError: string; isAgentResponding: boolean; isSending: boolean; messages: Message[]; lastMessageSafetySpacer: number; showScrollToLatest: boolean; latestButtonBottom: number; onScrollToLatest: () => void;
  attachments: MessageAttachment[]; keyboardOffset: number; attachmentTrayRef: RefObject<HTMLDivElement | null>; removeAttachment: (attachmentId: string) => void; notice: KivoNotice | null;
  draftPrompt: string; setDraftPrompt: (value: string) => void; handleSend: () => void; setActionSheetOpen: Dispatch<SetStateAction<boolean>>; setWorkspaceOpen: Dispatch<SetStateAction<boolean>>; toggleMic: () => void; canSend: boolean; isListening: boolean; isBusy: boolean; placeholder: string; composerDockRef: RefObject<HTMLDivElement | null>;
  referralToastOpen: boolean; referralToastTitle: string; referralToastDetail: string; setReferralToastOpen: Dispatch<SetStateAction<boolean>>;
  actionSheetOpen: boolean; gmailConnected: boolean; calendarConnected: boolean; closeActionSheet: () => void; openFilePicker: (accept?: string) => void; handlePasteLink: () => void; handleAiAction: (id: 'summarize-day' | 'find-priorities' | 'deep-research' | 'live-search') => void; handleActionTool: (id: 'gmail' | 'calendar' | 'money-saver' | 'tasks') => void;
  workspaceOpen: boolean; closeWorkspace: () => void; handleQuickAction: (id: 'analyze' | 'planner' | 'money-saver' | 'ask-agent') => void; handleConnectorAction: (connector: string, mode: 'connect' | 'connected' | 'manage' | 'toggle') => void; handleToolSelect: (id: 'finance-scanner' | 'memory-search' | 'research-mode' | 'compare-tool' | 'automation-builder') => void; handleRecentSelect: (id: 'gmail-sync' | 'subscription-scan' | 'weekly-planner') => void;
  fileInputRef: RefObject<HTMLInputElement | null>; filePickerAccept: string; onHiddenFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function KivoChatScreenLayout(props: Props) {
  const { userName, hasMessages, sidebarRecentChats, showSidebarRail, setShowSidebarRail, isSidebarOpen, setIsSidebarOpen, createNewChat, handleSidebarSearch, handleOpenChatFromSidebar, onOpenSettings, onQuickTask, onAnalyzeFile, onPlanMyDay, onOpenGmail, onOpenCalendar, onOpenDrive, onOpenWeb, onUpgrade, handleHeaderSummarize, handleHeaderCreateTask, mainScrollRef, scrollBottomPadding, streamError, refinedStreamError, isAgentResponding, isSending, messages, lastMessageSafetySpacer, showScrollToLatest, latestButtonBottom, onScrollToLatest, attachments, keyboardOffset, attachmentTrayRef, removeAttachment, notice, draftPrompt, setDraftPrompt, handleSend, setActionSheetOpen, setWorkspaceOpen, toggleMic, canSend, isListening, isBusy, placeholder, composerDockRef, referralToastOpen, referralToastTitle, referralToastDetail, setReferralToastOpen, actionSheetOpen, gmailConnected, calendarConnected, closeActionSheet, openFilePicker, handlePasteLink, handleAiAction, handleActionTool, workspaceOpen, closeWorkspace, handleQuickAction, handleConnectorAction, handleToolSelect, handleRecentSelect, fileInputRef, filePickerAccept, onHiddenFileInputChange } = props;
  const sidebarWidth = showSidebarRail ? KIVO_CHAT_SIDEBAR_RAIL_WIDTH : 0;
  const contentLeftOffset = sidebarWidth ? sidebarWidth + SIDEBAR_GAP : 0;
  const composerLeftOffset = sidebarWidth ? sidebarWidth + SIDEBAR_GAP : 12;
  const handleSidebarToggle = () => { if (showSidebarRail) { setShowSidebarRail(false); setIsSidebarOpen(false); return; } setShowSidebarRail(true); setIsSidebarOpen(false); };

  return (
    <div className="relative min-h-[100dvh] w-screen overflow-x-hidden bg-gradient-to-b from-[#f7f7f5] via-[#f5f5f3] to-[#f2f2f0] text-[#2f3640]">
      {showSidebarRail ? <KivoChatSidebarArea panelOpen={isSidebarOpen} onPanelOpenChange={setIsSidebarOpen} hasMessages={hasMessages} userName={userName} plan="free" recentChats={sidebarRecentChats} onNewChat={createNewChat} onSearch={handleSidebarSearch} onOpenChat={handleOpenChatFromSidebar} onOpenSettings={onOpenSettings} onQuickTask={onQuickTask} onAnalyzeFile={onAnalyzeFile} onPlanMyDay={onPlanMyDay} onOpenGmail={onOpenGmail} onOpenCalendar={onOpenCalendar} onOpenDrive={onOpenDrive} onOpenWeb={onOpenWeb} onUpgrade={onUpgrade} /> : null}
      <div className="relative min-h-[100dvh] transition-[padding-left] duration-300 ease-out" style={{ paddingLeft: `${contentLeftOffset}px` }}>
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-[560px] flex-col">
          <div className="sticky top-0 z-20 shrink-0 bg-[#f7f7f5]/90 backdrop-blur-xl"><KivoChatHeader hasMessages={hasMessages} isSidebarOpen={showSidebarRail} onSidebarToggle={handleSidebarToggle} onSummarize={handleHeaderSummarize} onCreateTask={handleHeaderCreateTask} /></div>
          <KivoChatScreenMainContent mainScrollRef={mainScrollRef} scrollBottomPadding={scrollBottomPadding} streamError={streamError} refinedStreamError={refinedStreamError} hasMessages={hasMessages} isAgentResponding={isAgentResponding} isSending={isSending} messages={messages} lastMessageSafetySpacer={lastMessageSafetySpacer} />
          <KivoChatScreenScrollToLatestButton show={showScrollToLatest} bottom={latestButtonBottom} onClick={onScrollToLatest} />
          <KivoChatScreenAttachmentTray attachments={attachments} keyboardOffset={keyboardOffset} attachmentTrayRef={attachmentTrayRef} onRemoveAttachment={removeAttachment} />
          <KivoChatScreenNoticeToast notice={notice} />
          <div className="[&>div]:!left-[var(--kivo-composer-left)] [&>div]:!right-3 [&>div]:!mx-0 [&>div]:!w-auto [&>div]:!max-w-none [&>div]:transition-[left,right,transform] [&>div]:duration-300 [&>div]:ease-out" style={{ ['--kivo-composer-left' as string]: `${composerLeftOffset}px` } as CSSProperties}>
            <KivoComposerDock value={draftPrompt} onChange={setDraftPrompt} onSend={handleSend} onPlusClick={() => setActionSheetOpen(true)} onQuickActionClick={() => setWorkspaceOpen(true)} onMicClick={toggleMic} canSend={canSend} isListening={isListening} isSending={isBusy} placeholder={placeholder} keyboardOffset={keyboardOffset} containerRef={composerDockRef} desktopShiftX={0} />
          </div>
          <KivoReferralSuccessToast open={referralToastOpen} title={referralToastTitle} detail={referralToastDetail} onClose={() => setReferralToastOpen(false)} />
          <KivoActionSheet open={actionSheetOpen} isListening={isListening} attachments={attachments} toolState={{ gmail: { connected: gmailConnected, subtitle: 'Inbox summary, urgent emails, subscriptions' }, calendar: { connected: calendarConnected, subtitle: 'Today plan, reminders, free time' }, 'money-saver': { connected: true, subtitle: 'Find leaks, subscriptions, savings' }, tasks: { connected: true, subtitle: 'Notes, todos, action items' } }} onClose={closeActionSheet} onAddImages={() => openFilePicker('image/*')} onAddFiles={() => openFilePicker()} onPasteLink={handlePasteLink} onVoiceInput={toggleMic} onAiAction={handleAiAction} onToolAction={handleActionTool} />
          <WorkspaceSheet open={workspaceOpen} onClose={closeWorkspace} onQuickAction={handleQuickAction} onConnectorAction={handleConnectorAction} onToolSelect={handleToolSelect} onRecentSelect={handleRecentSelect} />
          <input ref={fileInputRef} type="file" multiple accept={filePickerAccept} className="hidden" onChange={onHiddenFileInputChange} />
        </div>
      </div>
    </div>
  );
}
