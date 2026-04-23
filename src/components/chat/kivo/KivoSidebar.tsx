'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  BrainCircuit,
  CalendarDays,
  ChevronRight,
  FileText,
  FolderOpen,
  Globe,
  Mail,
  MessageCircle,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';

export type KivoSidebarSection =
  | 'new'
  | 'search'
  | 'chats'
  | 'agents'
  | 'tools'
  | 'alerts'
  | 'settings';

export type KivoSidebarRecentChat = {
  id: string;
  title: string;
  preview?: string;
  timestamp?: string;
};

type KivoSidebarProps = {
  hasMessages?: boolean;
  panelOpen: boolean;
  activeSection?: KivoSidebarSection;
  userName?: string;
  plan?: 'free' | 'plus';
  recentChats?: KivoSidebarRecentChat[];

  onClosePanel: () => void;
  onSectionChange: (section: KivoSidebarSection) => void;

  onNewChat?: () => void;
  onSearch?: () => void;
  onOpenChat?: (id: string) => void;
  onOpenAgents?: () => void;
  onOpenTools?: () => void;
  onOpenAlerts?: () => void;
  onOpenSettings?: () => void;

  onQuickTask?: () => void;
  onAnalyzeFile?: () => void;
  onPlanMyDay?: () => void;

  onOpenGmail?: () => void;
  onOpenCalendar?: () => void;
  onOpenDrive?: () => void;
  onOpenWeb?: () => void;

  onUpgrade?: () => void;
};

type RailItem = {
  id: KivoSidebarSection;
  label: string;
  icon: React.ReactNode;
};

const RAIL_ITEMS: RailItem[] = [
  {
    id: 'new',
    label: 'New chat',
    icon: <Plus className="h-[18px] w-[18px]" strokeWidth={2.2} />,
  },
  {
    id: 'search',
    label: 'Search',
    icon: <Search className="h-[18px] w-[18px]" strokeWidth={2.2} />,
  },
  {
    id: 'chats',
    label: 'Chats',
    icon: <MessageCircle className="h-[18px] w-[18px]" strokeWidth={2.2} />,
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: <BrainCircuit className="h-[18px] w-[18px]" strokeWidth={2.2} />,
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: <Sparkles className="h-[18px] w-[18px]" strokeWidth={2.2} />,
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: <Bell className="h-[18px] w-[18px]" strokeWidth={2.2} />,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings2 className="h-[18px] w-[18px]" strokeWidth={2.2} />,
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 pb-3 pt-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8A919E]">
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-black/[0.055]" />;
}

function RailButton({
  active,
  label,
  icon,
  onClick,
}: {
  active?: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={[
        'inline-flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200',
        active
          ? 'bg-[#151922] text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]'
          : 'text-[#151922] hover:bg-black/[0.04] active:scale-[0.97]',
      ].join(' ')}
    >
      {icon}
    </button>
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
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[24px] border border-black/[0.045] bg-white px-4 py-4 text-left shadow-[0_10px_26px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_14px_30px_rgba(15,23,42,0.05)] active:scale-[0.985]"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-black/[0.035] text-[#151922]">
        {icon}
      </div>
      <div className="text-[15px] font-semibold tracking-[-0.03em] text-[#151922]">
        {title}
      </div>
      <div className="mt-1 text-[13px] leading-[1.35] text-[#6D7482]">
        {subtitle}
      </div>
    </button>
  );
}

function SystemCard({
  icon,
  title,
  meta,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
}) {
  return (
    <div className="rounded-[22px] border border-black/[0.045] bg-white px-4 py-4 shadow-[0_8px_22px_rgba(15,23,42,0.03)]">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-black/[0.035] text-[#151922]">
        {icon}
      </div>
      <div className="text-[14px] font-semibold tracking-[-0.025em] text-[#151922]">
        {title}
      </div>
      <div className="mt-1 text-[13px] text-[#6D7482]">{meta}</div>
    </div>
  );
}

function RecentRow({
  chat,
  onClick,
}: {
  chat: KivoSidebarRecentChat;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors duration-150 hover:bg-black/[0.02]"
    >
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black/[0.035] text-[#151922]">
        <MessageCircle className="h-[17px] w-[17px]" strokeWidth={2.1} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium tracking-[-0.025em] text-[#151922]">
          {chat.title}
        </div>
        <div className="mt-1 truncate text-[13px] text-[#6D7482]">
          {chat.preview || 'Continue working'}
        </div>
      </div>

      {chat.timestamp ? (
        <div className="shrink-0 text-[12px] text-[#8A919E]">{chat.timestamp}</div>
      ) : null}
    </button>
  );
}

function ServiceTile({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[20px] border border-black/[0.045] bg-white px-3 py-4 text-center shadow-[0_8px_20px_rgba(15,23,42,0.028)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_26px_rgba(15,23,42,0.04)] active:scale-[0.985]"
    >
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-black/[0.03]">
        {icon}
      </div>
      <div className="text-[14px] font-medium tracking-[-0.02em] text-[#151922]">
        {label}
      </div>
    </button>
  );
}

function GmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M3 6.75L12 13.5L21 6.75V18a2 2 0 0 1-2 2h-1.25V9.76L12 14.06L6.25 9.76V20H5a2 2 0 0 1-2-2V6.75Z"
      />
      <path fill="#34A853" d="M21 6.75V8.2l-3.25 2.44V20H19a2 2 0 0 0 2-2V6.75Z" />
      <path fill="#4285F4" d="M3 6.75V18a2 2 0 0 0 2 2h1.25V10.64L3 8.2V6.75Z" />
      <path
        fill="#FBBC04"
        d="M3 6.75A2 2 0 0 1 5 5h.57L12 9.88L18.43 5H19a2 2 0 0 1 2 1.75L12 13.5L3 6.75Z"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="3" fill="#fff" />
      <path
        d="M7 2.75a.75.75 0 0 1 .75.75V5h8.5V3.5a.75.75 0 0 1 1.5 0V5H18a3 3 0 0 1 3 3v2H3V8a3 3 0 0 1 3-3h.25V3.5A.75.75 0 0 1 7 2.75Z"
        fill="#4285F4"
      />
      <path d="M3 10h18v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8Z" fill="#34A853" opacity=".14" />
      <text x="12" y="18" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#4285F4">
        31
      </text>
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
  return <Globe className="h-7 w-7 text-[#151922]" strokeWidth={2} />;
}

function FullPanelContent(props: KivoSidebarProps) {
  const {
    userName = 'Miro',
    plan = 'free',
    recentChats = [],
    onClosePanel,
    onQuickTask,
    onAnalyzeFile,
    onPlanMyDay,
    onOpenGmail,
    onOpenCalendar,
    onOpenDrive,
    onOpenWeb,
    onUpgrade,
    onOpenChat,
    onSearch,
    onSectionChange,
  } = props;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-4 pt-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7B5342] text-[24px] font-medium text-white">
            {userName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="truncate text-[17px] font-semibold tracking-[-0.035em] text-[#151922]">
              Good afternoon, {userName}
            </div>
            <div className="mt-1 text-[14px] text-[#6D7482]">Ready to operate</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClosePanel}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#151922] transition-colors hover:bg-black/[0.04]"
          aria-label="Close panel"
        >
          <X className="h-5 w-5" strokeWidth={2.1} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <button
          type="button"
          onClick={() => {
            onSectionChange('search');
            onSearch?.();
          }}
          className="mb-6 flex w-full items-center gap-3 rounded-[22px] border border-black/[0.045] bg-white px-4 py-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.03)] transition-all hover:bg-[#FCFCFD]"
        >
          <Search className="h-5 w-5 text-[#6D7482]" strokeWidth={2.2} />
          <span className="flex-1 text-[15px] text-[#8A919E]">
            Search chats, tools, memory...
          </span>
        </button>

        <SectionLabel>Quick actions</SectionLabel>
        <div className="grid grid-cols-2 gap-3 px-2 pb-5">
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
            subtitle="Schedule and prioritize"
            onClick={onPlanMyDay}
          />
          <ActionCard
            icon={<MessageCircle className="h-5 w-5" strokeWidth={2.1} />}
            title="Open Chats"
            subtitle="Continue from history"
            onClick={() => onSectionChange('chats')}
          />
        </div>

        <SectionLabel>Live systems</SectionLabel>
        <div className="grid grid-cols-2 gap-3 px-2 pb-5">
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

        <SectionLabel>Continue working</SectionLabel>
        <div className="mx-2 overflow-hidden rounded-[26px] border border-black/[0.045] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.03)]">
          {recentChats.length > 0 ? (
            recentChats.slice(0, 4).map((chat, index) => (
              <div key={chat.id}>
                {index > 0 ? <Divider /> : null}
                <RecentRow chat={chat} onClick={() => onOpenChat?.(chat.id)} />
              </div>
            ))
          ) : (
            <div className="px-5 py-5 text-[14px] text-[#6D7482]">No recent chats yet.</div>
          )}
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
            <div className="min-w-0">
              <div className="text-[16px] font-semibold tracking-[-0.03em] text-[#151922]">
                {plan === 'plus' ? 'Kivo Plus active' : 'Unlock Kivo Plus'}
              </div>
              <div className="mt-1 text-[13px] leading-[1.45] text-[#635E77]">
                {plan === 'plus'
                  ? 'Advanced agents and premium tools are ready.'
                  : 'Advanced agents, stronger memory and premium tools.'}
              </div>
            </div>

            <button
              type="button"
              onClick={onUpgrade}
              className="inline-flex shrink-0 items-center gap-1 rounded-2xl bg-[#11131A] px-4 py-3 text-[14px] font-medium text-white transition-all hover:bg-[#090B11] active:scale-[0.985]"
            >
              {plan === 'plus' ? 'Manage' : 'Upgrade'}
              <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatsPanel({
  recentChats = [],
  onOpenChat,
}: {
  recentChats?: KivoSidebarRecentChat[];
  onOpenChat?: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6">
        <div className="text-[18px] font-semibold tracking-[-0.035em] text-[#151922]">
          Chats
        </div>
        <div className="mt-1 text-[14px] text-[#6D7482]">Continue from recent conversations</div>
      </div>

      <div className="px-3 pb-6">
        <div className="overflow-hidden rounded-[26px] border border-black/[0.045] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.03)]">
          {recentChats.length > 0 ? (
            recentChats.map((chat, index) => (
              <div key={chat.id}>
                {index > 0 ? <Divider /> : null}
                <RecentRow chat={chat} onClick={() => onOpenChat?.(chat.id)} />
              </div>
            ))
          ) : (
            <div className="px-5 py-5 text-[14px] text-[#6D7482]">No chats yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AgentsPanel({ onUpgrade }: { onUpgrade?: () => void }) {
  const rows = [
    {
      title: 'Kivo Lite',
      desc: 'Fast everyday help and simple tasks.',
      badge: '',
    },
    {
      title: 'Kivo Smart',
      desc: 'Balanced reasoning, planning and productivity.',
      badge: '',
    },
    {
      title: 'Kivo Operator',
      desc: 'Advanced autonomous workflows for complex tasks.',
      badge: 'Plus',
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6">
        <div className="text-[18px] font-semibold tracking-[-0.035em] text-[#151922]">
          Agents
        </div>
        <div className="mt-1 text-[14px] text-[#6D7482]">Choose how Kivo should work</div>
      </div>

      <div className="px-3 pb-6">
        <div className="overflow-hidden rounded-[26px] border border-black/[0.045] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.03)]">
          {rows.map((row, index) => (
            <button
              key={row.title}
              type="button"
              onClick={row.badge ? onUpgrade : undefined}
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-black/[0.02]"
            >
              <div>
                <div className="text-[15px] font-semibold tracking-[-0.025em] text-[#151922]">
                  {row.title}
                </div>
                <div className="mt-1 text-[13px] leading-[1.4] text-[#6D7482]">
                  {row.desc}
                </div>
              </div>
              {row.badge ? (
                <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                  {row.badge}
                </span>
              ) : null}
              {index < rows.length - 1 ? (
                <span className="absolute left-5 right-5 bottom-0 h-px bg-black/[0.055]" />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolsPanel({
  onOpenGmail,
  onOpenCalendar,
  onOpenDrive,
  onOpenWeb,
}: {
  onOpenGmail?: () => void;
  onOpenCalendar?: () => void;
  onOpenDrive?: () => void;
  onOpenWeb?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6">
        <div className="text-[18px] font-semibold tracking-[-0.035em] text-[#151922]">
          Tools
        </div>
        <div className="mt-1 text-[14px] text-[#6D7482]">Connected services and web tools</div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 pb-6">
        <ServiceTile icon={<GmailIcon />} label="Gmail" onClick={onOpenGmail} />
        <ServiceTile icon={<CalendarIcon />} label="Calendar" onClick={onOpenCalendar} />
        <ServiceTile icon={<DriveIcon />} label="Drive" onClick={onOpenDrive} />
        <ServiceTile icon={<WebIcon />} label="Web" onClick={onOpenWeb} />
      </div>
    </div>
  );
}

function AlertsPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6">
        <div className="text-[18px] font-semibold tracking-[-0.035em] text-[#151922]">
          Alerts
        </div>
        <div className="mt-1 text-[14px] text-[#6D7482]">Important updates and system changes</div>
      </div>

      <div className="px-3 pb-6">
        <div className="overflow-hidden rounded-[26px] border border-black/[0.045] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.03)]">
          <div className="px-5 py-4">
            <div className="text-[15px] font-medium text-[#151922]">2 new alerts</div>
            <div className="mt-1 text-[13px] text-[#6D7482]">
              You can connect these to your real alert system next.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ onOpenSettings }: { onOpenSettings?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6">
        <div className="text-[18px] font-semibold tracking-[-0.035em] text-[#151922]">
          Settings
        </div>
        <div className="mt-1 text-[14px] text-[#6D7482]">Profile, preferences and account</div>
      </div>

      <div className="px-3 pb-6">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex w-full items-center justify-between rounded-[26px] border border-black/[0.045] bg-white px-5 py-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.03)] transition-colors duration-150 hover:bg-black/[0.02]"
        >
          <span className="text-[15px] font-medium text-[#151922]">Open settings</span>
          <ChevronRight className="h-4 w-4 text-[#6D7482]" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function SearchPanel({ onSearch }: { onSearch?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6">
        <div className="text-[18px] font-semibold tracking-[-0.035em] text-[#151922]">
          Search
        </div>
        <div className="mt-1 text-[14px] text-[#6D7482]">Search chats, tools and memory</div>
      </div>

      <div className="px-5 pb-6">
        <button
          type="button"
          onClick={onSearch}
          className="flex w-full items-center gap-3 rounded-[22px] border border-black/[0.045] bg-white px-4 py-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.03)] transition-all hover:bg-[#FCFCFD]"
        >
          <Search className="h-5 w-5 text-[#6D7482]" strokeWidth={2.2} />
          <span className="text-[15px] text-[#8A919E]">Tap to open search</span>
        </button>
      </div>
    </div>
  );
}

function PanelContent(props: KivoSidebarProps) {
  const { activeSection = 'chats' } = props;

  switch (activeSection) {
    case 'search':
      return <SearchPanel onSearch={props.onSearch} />;
    case 'chats':
      return <ChatsPanel recentChats={props.recentChats} onOpenChat={props.onOpenChat} />;
    case 'agents':
      return <AgentsPanel onUpgrade={props.onUpgrade} />;
    case 'tools':
      return (
        <ToolsPanel
          onOpenGmail={props.onOpenGmail}
          onOpenCalendar={props.onOpenCalendar}
          onOpenDrive={props.onOpenDrive}
          onOpenWeb={props.onOpenWeb}
        />
      );
    case 'alerts':
      return <AlertsPanel />;
    case 'settings':
      return <SettingsPanel onOpenSettings={props.onOpenSettings} />;
    case 'new':
      return <SearchPanel onSearch={props.onNewChat} />;
    default:
      return <ChatsPanel recentChats={props.recentChats} onOpenChat={props.onOpenChat} />;
  }
}

export default function KivoSidebar(props: KivoSidebarProps) {
  const {
    hasMessages = false,
    panelOpen,
    activeSection = 'chats',
    onClosePanel,
    onSectionChange,
    onNewChat,
    onSearch,
    onOpenAgents,
    onOpenTools,
    onOpenAlerts,
    onOpenSettings,
  } = props;

  const handleRailClick = (section: KivoSidebarSection) => {
    onSectionChange(section);

    switch (section) {
      case 'new':
        onNewChat?.();
        break;
      case 'search':
        onSearch?.();
        break;
      case 'agents':
        onOpenAgents?.();
        break;
      case 'tools':
        onOpenTools?.();
        break;
      case 'alerts':
        onOpenAlerts?.();
        break;
      case 'settings':
        onOpenSettings?.();
        break;
      default:
        break;
    }
  };

  return (
    <div className="pointer-events-none fixed inset-y-0 left-0 z-[60] flex">
      <div className="pointer-events-auto flex h-full items-start pl-3 pt-[88px]">
        <div className="flex h-[calc(100vh-104px)] w-[74px] flex-col items-center rounded-[30px] border border-black/[0.05] bg-white/88 px-3 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="mb-4 flex flex-col items-center gap-2">
            {RAIL_ITEMS.slice(0, 4).map((item) => (
              <RailButton
                key={item.id}
                label={item.label}
                icon={item.icon}
                active={activeSection === item.id && (panelOpen || hasMessages)}
                onClick={() => handleRailClick(item.id)}
              />
            ))}
          </div>

          <div className="my-2 h-px w-full bg-black/[0.06]" />

          <div className="flex flex-col items-center gap-2">
            {RAIL_ITEMS.slice(4).map((item) => (
              <RailButton
                key={item.id}
                label={item.label}
                icon={item.icon}
                active={activeSection === item.id && (panelOpen || hasMessages)}
                onClick={() => handleRailClick(item.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {panelOpen ? (
          <motion.div
            key="kivo-sidebar-panel"
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="pointer-events-auto flex h-full items-start pl-3 pt-[88px]"
          >
            <div className="h-[calc(100vh-104px)] w-[min(86vw,390px)] overflow-hidden rounded-[32px] border border-black/[0.05] bg-[#F6F7FA]/98 shadow-[0_22px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              {hasMessages ? <PanelContent {...props} /> : <FullPanelContent {...props} />}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {panelOpen ? (
          <motion.button
            type="button"
            aria-label="Close sidebar panel"
            onClick={onClosePanel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto fixed inset-0 -z-10 bg-transparent"
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
