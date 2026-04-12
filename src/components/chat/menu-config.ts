import {
  Bell,
  CircleUserRound,
  Crown,
  MessageSquare,
  Settings,
  SquareCheckBig,
  type LucideIcon,
} from 'lucide-react';

export type SharedMenuRow = {
  label: string;
  icon: LucideIcon;
  href?: string;
  action?: 'new-chat' | 'conversations';
  badge?: string;
};

export const sharedPrimaryMenu: SharedMenuRow[] = [
  { label: 'New Chat', icon: MessageSquare, action: 'new-chat' },
  { label: 'Conversations', icon: MessageSquare, action: 'conversations' },
  { label: 'Tasks', icon: SquareCheckBig, href: '/tasks' },
  { label: 'Alerts', icon: Bell, href: '/alerts' },
];

export const sharedSecondaryMenu: SharedMenuRow[] = [
  { label: 'Profile', icon: CircleUserRound, href: '/profile' },
  { label: 'Settings', icon: Settings, href: '/settings', badge: 'New' },
  { label: 'Upgrade', icon: Crown, href: '/upgrade' },
];
