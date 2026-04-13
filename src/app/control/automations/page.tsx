'use client';

import { useEffect, useState } from 'react';
import { AppShell, PremiumCard, ProductPageHeader, SmartButton } from '@/app/components/premium-ui';

const KEY = 'kivo_automation_settings_v1';

export default function AutomationsControlPage() {
  const [subscriptionScan, setSubscriptionScan] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(10);

  useEffect(() => {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { subscriptionScan?: boolean; dailyLimit?: number };
    setSubscriptionScan(parsed.subscriptionScan ?? true);
    setDailyLimit(parsed.dailyLimit ?? 10);
  }, []);

  const save = () => window.localStorage.setItem(KEY, JSON.stringify({ subscriptionScan, dailyLimit }));

  return <AppShell><ProductPageHeader pageTitle="Automations" pageSubtitle="Triggers and execution limits" showBack /><PremiumCard className="space-y-3 p-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={subscriptionScan} onChange={(e) => setSubscriptionScan(e.target.checked)} />Enable Gmail subscription scan trigger</label><label className="text-sm">Daily action limit <input type="number" className="ml-2 rounded border px-2" value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value) || 1)} /></label><SmartButton onClick={save}>Save automation settings</SmartButton></PremiumCard></AppShell>;
}
