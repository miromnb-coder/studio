import type { LucideIcon } from 'lucide-react';
import type { Agent, Conversation, Message } from '@/app/store/app-store-types';

export type Tab = 'Today' | 'Agents' | 'Work' | 'Time' | 'Chats' | 'Saved';

export type LibraryTab = {
  id: Tab;
  icon: LucideIcon;
};

export type LibraryTask = {
  id: string;
  title: string;
  subtitle: string;
  status: 'today' | 'in_progress' | 'done' | 'upcoming';
  dueLabel: string;
  priority?: 'high' | 'normal';
};

export type LibraryEvent = {
  id: string;
  title: string;
  startLabel: string;
  endLabel?: string;
  whenLabel: string;
};

export type LibraryAgentCard = {
  id: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  status: 'active' | 'idle';
  lastActivity: string;
};

export type LibrarySavedItem = {
  id: string;
  type: 'prompt' | 'memory' | 'answer' | 'note' | 'bookmark';
  title: string;
  subtitle: string;
  savedAtLabel: string;
};

export type LibraryData = {
  userName: string;
  greeting: string;
  focusProgress: number;
  aiSuggestion: string;
  conversations: Conversation[];
  conversationMessages: Record<string, Message[]>;
  tasks: LibraryTask[];
  events: LibraryEvent[];
  agents: LibraryAgentCard[];
  timeline: Array<{ id: string; label: string; title: string; timeRange: string }>;
  savedItems: LibrarySavedItem[];
  appAgents: Record<string, Agent>;
};
