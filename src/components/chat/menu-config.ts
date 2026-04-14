import {
  Bell,
  CircleUserRound,
  MessageSquare,
  MessageSquarePlus,
  Settings,
  SquareCheckBig,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

export type SharedMenuRow = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  action?: 'chat' | 'new-chat';
  badge?: string;
};

export const sharedPrimaryMenu: SharedMenuRow[] = [
  { id: 'new-chat', label: 'New Chat', icon: MessageSquarePlus, action: 'new-chat', href: '/chat' },
  { id: 'conversations', label: 'Conversations', icon: MessageSquare, href: '/history' },
  { id: 'tasks', label: 'Tasks', icon: SquareCheckBig, href: '/tasks' },
  { id: 'alerts', label: 'Alerts', icon: Bell, href: '/alerts' },
];

export const sharedSecondaryMenu: SharedMenuRow[] = [
  { id: 'profile', label: 'Profile', icon: CircleUserRound, href: '/profile' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  { id: 'upgrade', label: 'Upgrade', icon: ShieldCheck, href: '/upgrade' },
];
