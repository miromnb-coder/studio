'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, ChevronRight, Globe, Mail, Palette, Shield, Sparkles, Star, ToyBrick, Waypoints } from 'lucide-react';
import { useUserEntitlements } from '../hooks/use-user-entitlements';
import { AppShell, PremiumCard, ProductPageHeader, SectionHeader, SmartButton } from '../components/premium-ui';

type GmailStatusPayload = {
  connected?: boolean;
  status: 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';
  errorMessage?: string | null;
};

function Row({ icon: Icon, label, value, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 border-b border-[#e3e6ec] px-1 py-3 text-left last:border-b-0">
      <span className="rounded-xl border border-[#d8dce4] bg-[#eef1f6] p-2 text-[#677083]"><Icon className="h-4 w-4" /></span>
      <span className="flex-1 text-sm font-medium text-[#2f3644]">{label}</span>
      {value ? <span className="text-xs text-[#6f7786]">{value}</span> : null}
      <ChevronRight className="h-4 w-4 text-[#98a0ad]" />
    </button>
  );
}

export default function ControlPage() {
  const { plan } = useUserEntitlements();
  const [gmail, setGmail] = useState<GmailStatusPayload>({ status: 'disconnected', connected: false });

  const loadGmail = useCallback(async () => {
    const response = await fetch('/api/integrations/gmail/status', { cache: 'no-store' });
    if (!response.ok) return;
    const payload = (await response.json()) as GmailStatusPayload;
    setGmail(payload);
  }, []);

  useEffect(() => {
    void loadGmail();
  }, [loadGmail]);

  return (
    <AppShell>
      <ProductPageHeader pageTitle="Control" pageSubtitle="Everything important in one place" />

      <div className="space-y-3">
        <PremiumCard className="p-4">
          <SectionHeader title="Connected apps" subtitle="Data sources powering your operator" />
          <Row icon={Mail} label="Gmail" value={gmail.connected ? 'Connected' : 'Not connected'} onClick={() => window.location.assign('/profile')} />
          <Row icon={Waypoints} label="Finance sync" value="Daily" />
        </PremiumCard>

        <PremiumCard className="p-4">
          <SectionHeader title="Workspace" subtitle="Model, language, notifications, and interface" />
          <Row icon={ToyBrick} label="AI model" value="GPT-5.4" />
          <Row icon={Bell} label="Notifications" value="Important only" />
          <Row icon={Shield} label="Privacy" value="Standard protection" />
          <Row icon={Globe} label="Language" value="English" />
          <Row icon={Palette} label="Appearance" value="System light" />
        </PremiumCard>

        <PremiumCard className="p-4">
          <SectionHeader title="Premium" subtitle="Plan and benefit controls" />
          <Row icon={Star} label="Plan" value={plan === 'premium' ? 'Premium active' : 'Free'} onClick={() => window.location.assign('/upgrade')} />
          <SmartButton className="mt-3 w-full justify-center" onClick={() => window.location.assign('/upgrade')}>
            <Sparkles className="mr-2 h-4 w-4" /> Manage Premium
          </SmartButton>
        </PremiumCard>
      </div>
    </AppShell>
  );
}
