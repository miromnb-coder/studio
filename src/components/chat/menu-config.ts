import {
  Aperture,
  CircleUserRound,
  Crosshair,
  MessageSquare,
  MessageSquarePlus,
  Settings,
  Sparkles,
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
  { id: 'chat', label: 'Chat', icon: MessageSquare, action: 'chat', href: '/chat' },
  { id: 'new-chat', label: 'New Chat', icon: MessageSquarePlus, action: 'new-chat', href: '/chat' },
  { id: 'conversations', label: 'Conversations', icon: MessageSquare, href: '/history' },
  { id: 'focus', label: 'Focus', icon: Crosshair, href: '/focus' },
  { id: 'actions', label: 'Actions', icon: Sparkles, href: '/actions' },
  { id: 'memory', label: 'Memory', icon: Aperture, href: '/memory' },
];

export const sharedSecondaryMenu: SharedMenuRow[] = [
  { id: 'profile', label: 'Profile', icon: CircleUserRound, href: '/profile' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];
