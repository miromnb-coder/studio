import type { LucideIcon } from 'lucide-react';

export type ProfileStat = {
  id: string;
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  accent?: 'green' | 'neutral';
  progress?: number;
};

export type SettingsItem = {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  icon: LucideIcon;
  value?: string;
};

export type SettingsSectionData = {
  id: string;
  title: string;
  items: SettingsItem[];
};

export type UserIdentity = {
  fullName: string;
  email: string;
  avatarLetter: string;
  badge: string;
  route: string;
};

export type ProPlanData = {
  title: string;
  renewsOn: string;
  creditsUsed: number;
  creditsLimit: number;
  upgradeRoute: string;
  detailsRoute: string;
};
