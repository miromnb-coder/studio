import type { CSSProperties, ChangeEvent, Dispatch, RefObject, SetStateAction } from 'react';
import type { MessageAttachment } from '@/app/store/app-store';
import type { Message } from '@/app/store/app-store-types';
import { useRouter } from 'next/navigation';
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

const SIDEBAR_GAP = 12; type KivoNotice = KivoChatNotice;
/* rest unchanged */
"+"