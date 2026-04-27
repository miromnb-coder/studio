import type { LucideIcon } from 'lucide-react';

export type Tab = 'Today' | 'Agents' | 'Work' | 'Time' | 'Chats' | 'Saved';

export type LibraryTab = {
  id: Tab;
  icon: LucideIcon;
};
