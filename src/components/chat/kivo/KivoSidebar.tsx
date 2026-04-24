'use client';

import type { ReactNode } from 'react';
import {
  Bell,
  BrainCircuit,
  MessageCircle,
  Plus,
  Search,
  Settings2,
  Sparkles,
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

export type KivoSidebarProps = {
  hasMessages?: boolean;
  panelOpen?: boolean;
  activeSection: KivoSidebarSection | null;
  userName?: string;
  plan?: 'free' | 'plus';
  recentChats?: KivoSidebarRecentChat[];

  onClosePanel?: () => void;
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
  icon: ReactNode;
  dividerBefore?: boolean;
  badge?: string;
};

const ICON_SIZE = 'h-[17px] w-[17px]';

const RAIL_ITEMS: RailItem[] = [
  {
    id: 'new',
    label: 'New chat',
    icon: <Plus className={ICON_SIZE} strokeWidth={2.15} />,
  },
  {
    id: 'search',
    label: 'Search',
    icon: <Search className={ICON_SIZE} strokeWidth={2.15} />,
  },
  {
    id: 'chats',
    label: 'Chats',
    icon: <MessageCircle className={ICON_SIZE} strokeWidth={2.15} />,
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: <BrainCircuit className={ICON_SIZE} strokeWidth={2.15} />,
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: <Sparkles className={ICON_SIZE} strokeWidth={2.15} />,
    dividerBefore: true,
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: <Bell className={ICON_SIZE} strokeWidth={2.15} />,
    badge: '2',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings2 className={ICON_SIZE} strokeWidth={2.15} />,
  },
];

function RailButton({
  active,
  label,
  icon,
  badge,
  onClick,
}: {
  active?: boolean;
  label: string;
  icon: ReactNode;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={[
        'relative inline-flex h-10 w-10 items-center justify-center rounded-[15px]',
        'transition-all duration-200 ease-out active:scale-[0.96]',
        active
          ? 'bg-black/[0.065] text-[#111827] shadow-[0_8px_22px_rgba(15,23,42,0.055)]'
          : 'text-[#151922] hover:bg-black/[0.035]',
      ].join(' ')}
    >
      {icon}

      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#111827] px-1 text-[10px] font-semibold leading-none text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export default function KivoSidebar({
  activeSection,
  userName,
  onSectionChange,
}: KivoSidebarProps) {
  return (
    <nav
      aria-label="Kivo navigation"
      className="flex h-full w-full flex-col items-center bg-transparent px-2 py-4"
    >
      <button
        type="button"
        aria-label="Profile"
        className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#7B5342] text-[18px] font-medium text-white shadow-[0_6px_18px_rgba(123,83,66,0.16)] active:scale-[0.96]"
      >
        {(userName || 'M').charAt(0).toUpperCase()}
      </button>

      <div className="flex flex-1 flex-col items-center gap-2">
        {RAIL_ITEMS.map((item) => (
          <div key={item.id} className="flex flex-col items-center">
            {item.dividerBefore ? (
              <div className="mb-2 mt-1 h-px w-8 bg-black/[0.055]" />
            ) : null}

            <RailButton
              label={item.label}
              icon={item.icon}
              badge={item.badge}
              active={activeSection === item.id}
              onClick={() => onSectionChange(item.id)}
            />
          </div>
        ))}
      </div>

      <div className="pb-1 text-center text-[11px] font-medium tracking-[-0.02em] text-[#8A919E]">
        <div className="text-[22px] font-semibold leading-none tracking-[-0.08em]">K</div>
        <div>Kivo</div>
      </div>
    </nav>
  );
}

export function KivoSidebarPanelContent() {
  return null;
}
