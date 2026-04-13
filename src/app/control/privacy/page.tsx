'use client';

import { useEffect, useState } from 'react';
import { AppShell, PremiumCard, ProductPageHeader, SmartButton } from '@/app/components/premium-ui';

const KEY = 'kivo_privacy_settings_v1';

export default function PrivacyControlPage() {
  const [retentionDays, setRetentionDays] = useState(90);
  const [allowMemory, setAllowMemory] = useState(true);

  useEffect(() => {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { retentionDays?: number; allowMemory?: boolean };
    setRetentionDays(parsed.retentionDays ?? 90);
    setAllowMemory(parsed.allowMemory ?? true);
  }, []);

  const save = () => window.localStorage.setItem(KEY, JSON.stringify({ retentionDays, allowMemory }));

  return <AppShell><ProductPageHeader pageTitle="Privacy" pageSubtitle="Retention and permission controls" showBack /><PremiumCard className="space-y-3 p-4"><label className="text-sm">Retention days <input type="number" className="ml-2 rounded border px-2" value={retentionDays} onChange={(e) => setRetentionDays(Number(e.target.value) || 30)} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allowMemory} onChange={(e) => setAllowMemory(e.target.checked)} />Allow memory indexing</label><SmartButton onClick={save}>Save privacy settings</SmartButton></PremiumCard></AppShell>;
}
