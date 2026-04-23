'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  FileText,
  FolderOpen,
  Globe,
  Mail,
  MessageCircle,
  Search,
  Settings2,
  Sparkles,
  BrainCircuit,
  Bell,
  Wallet,
  ChevronRight,
  Plus,
  X,
  Menu,
} from 'lucide-react';

type SidebarRecentChat = {
  id: string;
  title: string;
  preview?: string;
  timestamp?: string;
  pinned?: boolean;
};

type KivoSidebarProps = {
  open: boolean;
  onClose: () => void;
  userName: string;
  plan: 'free' | 'plus';
  activeSystemsLabel?: string;
  recentChats: SidebarRecentChat[];
  onNewChat: () => void;
  onQuickTask: () => void;
  onAnalyzeFile: () => void;
  onPlanMyDay: () => void;
  onOpenGmail: () => void;
  onOpenCalendar: () => void;
  onOpenDrive: () => void;
  onOpenWeb: () => void;
  onOpenSettings: () => void;
  onUpgrade: () => void;
  onOpenChat: (id: string) => void;
  onSearchClick?: () => void;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 pb-3 pt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8B919D]">
      {children}
    </div>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[24px] border border-black/[0.045] bg-white px-5 py-5 text-left shadow-[0_10px_26px_rgba(15,23,42,0.035)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_14px_32px_rgba(15,23,42,0.05)] active:translate-y-0 active:scale-[0.985]"
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-black/[0.035] text-[#141922]">
        {icon}
      </div>
      <div className="text-[16px] font-semibold tracking-[-0.03em] text-[#141922]">
        {title}
      </div>
      <div className="mt-1 text-[14px] leading-[1.35] text-[#6D7482]">
        {subtitle}
      </div>
    </button>
  );
}

function SystemCard({
  icon,
  title,
  meta,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      {...(onClick ? { type: 'button', onClick } : {})}
      className="rounded-[22px] border border-black/[0.045] bg-white px-4 py-4 text-left shadow-[0_8px_22px_rgba(15,23,42,0.03)] transition-all duration-200 hover:bg-[#FCFCFD]"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-black/[0.035] text-[#141922]">
        {icon}
      </div>
      <div className="text-[15px] font-semibold tracking-[-0.025em] text-[#141922]">
        {title}
      </div>
      <div className="mt-1 text-[14px] text-[#6D7482]">{meta}</div>
    </Wrapper>
  );
}

function ServiceTile({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[22px] border border-black/[0.045] bg-white px-4 py-5 text-center shadow-[0_8px_20px_rgba(15,23,42,0.028)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_28px_rgba(15,23,42,0.04)] active:scale-[0.985]"
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.03]">
        {icon}
      </div>
      <div className="text-[15px] font-medium tracking-[-0.02em] text-[#141922]">
        {label}
      </div>
    </button>
  );
}

function RecentRow({
  chat,
  onClick,
}: {
  chat: SidebarRecentChat;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 border-t border-black/[0.05] px-5 py-4 text-left transition-colors duration-150 hover:bg-black/[0.018]"
    >
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black/[0.035] text-[#141922]">
        <MessageCircle className="h-[18px] w-[18px]" strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[16px] font-medium tracking-[-0.025em] text-[#141922]">
          {chat.title}
        </div>
        <div className="mt-1 truncate text-[14px] text-[#6D7482]">
          {chat.preview || 'Continue working'}
        </div>
      </div>

      <div className="shrink-0 pl-2 text-[13px] text-[#7C8390]">
        {chat.timestamp || ''}
      </div>
    </button>
  );
}

function GmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <path fill="#EA4335" d="M3 6.75L12 13.5L21 6.75V18a2 2 0 0 1-2 2h-1.25V9.76L12 14.06L6.25 9.76V20H5a2 2 0 0 1-2-2V6.75Z" />
      <path fill="#34A853" d="M21 6.75V8.2l-3.25 2.44V20H19a2 2 0 0 0 2-2V6.75Z" />
      <path fill="#4285F4" d="M3 6.75V18a2 2 0 0 0 2 2h1.25V10.64L3 8.2V6.75Z" />
      <path fill="#FBBC04" d="M3 6.75A2 2 0 0 1 5 5h.57L12 9.88L18.43 5H19a2 2 0 0 1 2 1.75L12 13.5L3 6.75Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="3" fill="#fff" />
      <path d="M7 2.75a.75.75 0 0 1 .75.75V5h8.5V3.5a.75.75 0 0 1 1.5 0V5H18a3 3 0 0 1 3 3v2H3V8a3 3 0 0 1 3-3h.25V3.5A.75.75 0 0 1 7 2.75Z" fill="#4285F4" />
      <path d="M3 10h18v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8Z" fill="#34A853" opacity=".14" />
      <text x="12" y="18" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#4285F4">31</text>
      <rect x="3" y="9" width="18" height="1.2" fill="#EA4335" opacity=".9" />
    </svg>
  );
}

function DriveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <path d="M8 3h4l5 8h-4L8 3Z" fill="#0F9D58" />
      <path d="M7 4.2L2 13l2 3.5 5-8.7L7 4.2Z" fill="#4285F4" />
      <path d="M10.5 12H22l-2 3.5H8.5L10.5 12Z" fill="#F4B400" />
      <path d="M8.5 16H20l2 3.5H10.5L8.5 16Z" fill="#0F9D58" opacity=".9" />
      <path d="M2 13h11l-2 3.5H4L2 13Z" fill="#4285F4" opacity=".95" />
    </svg>
  );
}

function WebIcon() {
  return <Globe className="h-7 w-7 text-[#141922]" strokeWidth={2} />;
}

export function KivoSidebar({
  open,
  onClose,
  userName,
  plan,
  activeSystemsLabel = '2 active systems',
  recentChats,
  onNewChat,
  onQuickTask,
  onAnalyzeFile,
  onPlanMyDay,
  onOpenGmail,
  onOpenCalendar,
  onOpenDrive,
  onOpenWeb,
  onOpenSettings,
  onUpgrade,
  onOpenChat,
  onSearchClick,
}: KivoSidebarProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-[rgba(15,23,42,0.18)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.aside
            className="fixed inset-y-0 left-0 z-[80] w-[min(88vw,540px)] bg-[#F6F7FA] shadow-[0_22px_70px_rgba(15,23,42,0.16)]"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            <div className="flex h-full flex-col overflow-hidden rounded-r-[34px] border-r border-black/[0.05]">
              <div className="flex items-center justify-between px-6 pb-4 pt-7">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7B5342] text-[28px] font-medium text-white">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[18px] font-semibold tracking-[-0.035em] text-[#141922]">
                      Good afternoon, {userName} 👋
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[15px] text-[#5E6572]">
                      <span>{activeSystemsLabel}</span>
                      <span className="h-2 w-2 rounded-full bg-black/55" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#141922] transition-colors hover:bg-black/[0.04]"
                    aria-label="Open settings"
                  >
                    <Settings2 className="h-5 w-5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#141922] transition-colors hover:bg-black/[0.04]"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" strokeWidth={2} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-8">
                <button
                  type="button"
                  onClick={onSearchClick}
                  className="mb-6 flex w-full items-center gap-3 rounded-[22px] border border-black/[0.045] bg-white px-5 py-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.03)] transition-all hover:bg-[#FCFCFD]"
                >
                  <Search className="h-5 w-5 text-[#6D7482]" strokeWidth={2.2} />
                  <span className="flex-1 text-[16px] text-[#8B919D]">
                    Search chats, tools, memory...
                  </span>
                </button>

                <SectionLabel>Quick actions</SectionLabel>
                <div className="grid grid-cols-2 gap-3 px-2 pb-5">
                  <ActionCard
                    icon={<MessageCircle className="h-5 w-5" strokeWidth={2.1} />}
                    title="New Chat"
                    subtitle="Ask Kivo anything"
                    onClick={onNewChat}
                  />
                  <ActionCard
                    icon={<Sparkles className="h-5 w-5" strokeWidth={2.1} />}
                    title="Quick Task"
                    subtitle="Get something done fast"
                    onClick={onQuickTask}
                  />
                  <ActionCard
                    icon={<FileText className="h-5 w-5" strokeWidth={2.1} />}
                    title="Analyze File"
                    subtitle="Upload and get insights"
                    onClick={onAnalyzeFile}
                  />
                  <ActionCard
                    icon={<CalendarDays className="h-5 w-5" strokeWidth={2.1} />}
                    title="Plan My Day"
                    subtitle="Plan tasks and schedule"
                    onClick={onPlanMyDay}
                  />
                </div>

                <SectionLabel>Live systems</SectionLabel>
                <div className="grid grid-cols-4 gap-3 px-2 pb-5">
                  <SystemCard
                    icon={<BrainCircuit className="h-5 w-5" strokeWidth={2.1} />}
                    title="Smart Agent"
                    meta="Ready"
                  />
                  <SystemCard
                    icon={<FolderOpen className="h-5 w-5" strokeWidth={2.1} />}
                    title="Memory"
                    meta="84 insights"
                  />
                  <SystemCard
                    icon={<Bell className="h-5 w-5" strokeWidth={2.1} />}
                    title="Alerts"
                    meta="2 new"
                  />
                  <SystemCard
                    icon={<Wallet className="h-5 w-5" strokeWidth={2.1} />}
                    title="Finance"
                    meta="Tracking"
                  />
                </div>

                <div className="flex items-center justify-between px-2 pb-3 pt-1">
                  <SectionLabel>Continue working</SectionLabel>
                  <button
                    type="button"
                    onClick={onSearchClick}
                    className="inline-flex items-center gap-1 pr-2 text-[15px] font-medium text-[#6D7482] transition-colors hover:text-[#141922]"
                  >
                    See all
                    <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
                  </button>
                </div>

                <div className="mx-2 overflow-hidden rounded-[28px] border border-black/[0.045] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.03)]">
                  {recentChats.slice(0, 5).map((chat, index) => (
                    <div key={chat.id}>
                      {index > 0 ? <DividerLine /> : null}
                      <RecentRow chat={chat} onClick={() => onOpenChat(chat.id)} />
                    </div>
                  ))}
                </div>

                <SectionLabel>Tools & integrations</SectionLabel>
                <div className="grid grid-cols-4 gap-3 px-2 pb-6">
                  <ServiceTile icon={<GmailIcon />} label="Gmail" onClick={onOpenGmail} />
                  <ServiceTile icon={<CalendarIcon />} label="Calendar" onClick={onOpenCalendar} />
                  <ServiceTile icon={<DriveIcon />} label="Drive" onClick={onOpenDrive} />
                  <ServiceTile icon={<WebIcon />} label="Web" onClick={onOpenWeb} />
                </div>

                <div className="mx-2 rounded-[28px] border border-[#E7DDFE] bg-[#F5F1FF] px-5 py-5 shadow-[0_12px_28px_rgba(109,40,217,0.06)]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-[#6D28D9]">
                        <Sparkles className="h-6 w-6" strokeWidth={2.1} />
                      </div>

                      <div className="min-w-0">
                        <div className="text-[17px] font-semibold tracking-[-0.03em] text-[#141922]">
                          {plan === 'plus' ? 'Kivo Plus active' : 'Unlock Kivo Plus'}
                        </div>
                        <div className="mt-1 text-[14px] leading-[1.4] text-[#635E77]">
                          {plan === 'plus'
                            ? 'Advanced agents and premium tools are already available.'
                            : 'Advanced agents, unlimited memory, premium tools and priority support.'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onUpgrade}
                      className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#11131A] px-4 py-3 text-[15px] font-medium text-white transition-all hover:bg-[#090B11] active:scale-[0.985]"
                    >
                      {plan === 'plus' ? 'Manage' : 'Upgrade'}
                      <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function DividerLine() {
  return <div className="h-px bg-black/[0.05]" />;
}
