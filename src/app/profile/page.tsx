'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Bot,
  CalendarCheck2,
  CircleHelp,
  Clock3,
  Globe,
  Info,
  Link,
  MessageCircle,
  Moon,
  Plug,
  Shield,
  Sparkles,
  Star,
  User,
} from 'lucide-react';
import { ProfileHeader } from '@/app/profile/components/ProfileHeader';
import { ProfileIdentity } from '@/app/profile/components/ProfileIdentity';
import { ProCard } from '@/app/profile/components/ProCard';
import { SettingsSection } from '@/app/profile/components/SettingsSection';
import { StatsGrid } from '@/app/profile/components/StatsGrid';
import type { ProPlanData, ProfileStat, SettingsSectionData, UserIdentity } from '@/app/profile/types';

export default function ProfilePage() {
  const router = useRouter();

  const user = useMemo<UserIdentity>(
    () => ({
      fullName: 'Miro Saastamoinen',
      email: 'miromnbmnbmnb@gmail.com',
      avatarLetter: 'M',
      badge: 'Kivo Pro',
      route: '/settings/account',
    }),
    [],
  );

  const stats = useMemo<ProfileStat[]>(
    () => [
      { id: 'intelligence', icon: Sparkles, title: 'Intelligence score', value: '86', subtext: '+12 this week', accent: 'green' },
      { id: 'memory', icon: BookOpen, title: 'Memory stored', value: '1.2 GB', subtext: '23% of limit', progress: 23 },
      { id: 'tools', icon: Link, title: 'Connected tools', value: '8', subtext: 'Active', accent: 'green' },
      { id: 'saved', icon: Clock3, title: 'Time saved', value: '14.5 h', subtext: 'This week' },
    ],
    [],
  );

  const plan = useMemo<ProPlanData>(
    () => ({
      title: 'Kivo Pro',
      renewsOn: 'May 03, 2026',
      creditsUsed: 435,
      creditsLimit: 1000,
      upgradeRoute: '/upgrade',
      detailsRoute: '/usage',
    }),
    [],
  );

  const sections = useMemo<SettingsSectionData[]>(
    () => [
      {
        id: 'kivo',
        title: 'Kivo',
        items: [
          { id: 'tasks', title: 'Scheduled tasks', subtitle: 'View and manage your upcoming tasks', route: '/tasks', icon: CalendarCheck2 },
          { id: 'agents', title: 'Agents', subtitle: 'Manage your AI agents and settings', route: '/agents', icon: Bot },
          { id: 'knowledge', title: 'Knowledge', subtitle: 'Your memory, documents and context', route: '/memory', icon: BookOpen },
          { id: 'history', title: 'Chats & History', subtitle: 'Browse your conversations', route: '/history', icon: MessageCircle },
          { id: 'automations', title: 'Automations', subtitle: 'Workflows and recurring actions', route: '/automations', icon: Sparkles },
          { id: 'integrations', title: 'Integrations', subtitle: 'Connect apps and services', route: '/settings/data-sources', icon: Plug },
          { id: 'privacy', title: 'Data & Privacy', subtitle: 'Control your data and privacy', route: '/settings/privacy', icon: Shield },
        ],
      },
      {
        id: 'account',
        title: 'Account',
        items: [
          { id: 'account', title: 'Account', subtitle: 'Profile, email, security', route: '/settings/account', icon: User },
          { id: 'language', title: 'Language', subtitle: 'App language', route: '/settings/general', icon: Globe, value: 'English' },
          {
            id: 'appearance',
            title: 'Appearance',
            subtitle: 'Theme and display',
            route: '/settings/general',
            icon: Moon,
            value: 'Follow system',
          },
        ],
      },
      {
        id: 'more',
        title: 'More',
        items: [
          { id: 'news', title: "What’s new", subtitle: 'See latest updates and features', route: '/whats-new', icon: Star },
          { id: 'support', title: 'Help & Support', subtitle: 'Get help and contact support', route: '/support', icon: CircleHelp },
          { id: 'about', title: 'About Kivo', subtitle: 'Version and legal information', route: '/about', icon: Info, value: 'v1.0.0' },
        ],
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-[#f6f6f5] text-[#111111]">
      <ProfileHeader onBack={() => router.back()} onNotifications={() => router.push('/notifications')} />

      <main className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2">
        <ProfileIdentity user={user} onOpen={() => router.push(user.route)} />

        <StatsGrid stats={stats} />

        <ProCard
          data={plan}
          onUpgrade={() => router.push(plan.upgradeRoute)}
          onViewDetails={() => router.push(plan.detailsRoute)}
        />

        <div className="space-y-5">
          {sections.map((section) => (
            <SettingsSection key={section.id} section={section} onPress={(route) => router.push(route)} />
          ))}
        </div>

        <div className="mx-auto h-1.5 w-36 rounded-full bg-[#0a0a0a] opacity-95" />
      </main>
    </div>
  );
}
