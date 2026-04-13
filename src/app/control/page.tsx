'use client';

import { useMemo } from 'react';
import { ArrowRight, Lock, Settings2, Shield, UserCircle2, Waypoints } from 'lucide-react';
import { useUserEntitlements } from '../hooks/use-user-entitlements';
import { AppShell, PremiumCard, ProductPageHeader, SectionHeader, SmartButton } from '../components/premium-ui';
import { ConnectorLogo } from '../components/connector-logos';

export default function ControlPage() {
  const { plan } = useUserEntitlements();
  const connectors = useMemo(() => ['Gmail', 'Google Calendar', 'Google Drive', 'GitHub', 'Outlook', 'Browser'] as const, []);

  return (
    <AppShell>
      <ProductPageHeader pageTitle="Control" pageSubtitle="Settings, privacy, account, and integrations" />
      <div className="space-y-3">
        <PremiumCard className="space-y-3 p-4">
          <SectionHeader title="Integrations" subtitle="Premium connectors with real service visuals" />
          <div className="grid grid-cols-3 gap-2">
            {connectors.map((name) => (
              <button key={name} type="button" className="tap-feedback rounded-[14px] border border-[#e7eaf0] bg-[#fcfcfd] p-2 text-center">
                <div className="mb-1 flex justify-center"><ConnectorLogo name={name} /></div>
                <p className="text-[11px] font-medium text-[#111111]">{name}</p>
              </button>
            ))}
          </div>
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="System center" subtitle="Everything important in one place" />
          {[
            { title: 'Account', icon: UserCircle2, detail: 'Manage profile, security, and identity' },
            { title: 'Privacy', icon: Shield, detail: 'Data controls, retention, and permissions' },
            { title: 'App preferences', icon: Settings2, detail: 'Theme, notifications, and workspace defaults' },
            { title: 'Automations', icon: Waypoints, detail: 'Connected triggers and execution limits' },
          ].map((row) => {
            const Icon = row.icon;
            return (
            <button key={row.title} className="tap-feedback flex w-full items-center gap-3 rounded-[16px] border border-[#e7eaf0] bg-[#fcfcfd] p-3 text-left" type="button">
              <Icon className="h-4 w-4 text-[#111111]" />
              <span className="flex-1">
                <p className="text-sm font-semibold text-[#111111]">{row.title}</p>
                <p className="text-xs text-[#636a76]">{row.detail}</p>
              </span>
              <ArrowRight className="h-4 w-4 text-[#9aa1ab]" />
            </button>
            );
          })}
        </PremiumCard>

        <PremiumCard className="p-4">
          <SectionHeader title="Plan" subtitle="Premium control and usage" />
          <p className="rounded-[14px] border border-[#e7eaf0] bg-[#fcfcfd] px-3 py-2 text-sm text-[#111111]">Current plan: <strong>{plan}</strong></p>
          <SmartButton className="mt-3 w-full" onClick={() => window.location.assign('/upgrade')}><Lock className="mr-2 h-4 w-4" />Manage subscription</SmartButton>
        </PremiumCard>
      </div>
    </AppShell>
  );
}
