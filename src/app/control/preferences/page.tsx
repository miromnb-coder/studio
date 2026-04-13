'use client';

import { useEffect, useState } from 'react';
import { AppShell, PremiumCard, ProductPageHeader, SmartButton } from '@/app/components/premium-ui';

const KEY = 'kivo_app_preferences_v1';

export default function PreferencesControlPage() {
  const [theme, setTheme] = useState('system');
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { theme?: string; notifications?: boolean };
    setTheme(parsed.theme || 'system');
    setNotifications(parsed.notifications ?? true);
  }, []);

  const save = () => window.localStorage.setItem(KEY, JSON.stringify({ theme, notifications }));

  return <AppShell><ProductPageHeader pageTitle="App preferences" pageSubtitle="Theme, notifications, and defaults" showBack /><PremiumCard className="space-y-3 p-4"><select value={theme} onChange={(e) => setTheme(e.target.value)} className="rounded border px-2 py-1 text-sm"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />Enable notifications</label><SmartButton onClick={save}>Save preferences</SmartButton></PremiumCard></AppShell>;
}
