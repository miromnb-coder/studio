import {
  Aperture,
  CircleUserRound,
  Crosshair,
  Crown,
  MessageSquare,
  SlidersHorizontal,
  Sparkles,
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
  { label: 'Focus', icon: Crosshair, href: '/focus' },
  { label: 'Actions', icon: Sparkles, href: '/actions' },
  { label: 'Memory', icon: Aperture, href: '/memory' },
];

export const sharedSecondaryMenu: SharedMenuRow[] = [
  { label: 'Profile', icon: CircleUserRound, href: '/profile' },
  { label: 'Control', icon: SlidersHorizontal, href: '/control', badge: 'New' },
  { label: 'Upgrade', icon: Crown, href: '/upgrade' },
];
