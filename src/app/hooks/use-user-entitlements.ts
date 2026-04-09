'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '@/app/store/app-store';

type UsageState = {
  current: number;
  limit: number;
  remaining: number;
  lastResetDate: string;
};

type PlanType = 'FREE' | 'PREMIUM';

const defaultUsage: UsageState = {
  current: 0,
  limit: 10,
  remaining: 10,
  lastResetDate: new Date().toISOString().slice(0, 10),
};

export function useUserEntitlements() {
  const user = useAppStore((s) => s.user);
  const [plan, setPlan] = useState<PlanType>('FREE');
  const [usage, setUsage] = useState<UsageState>(defaultUsage);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setPlan('FREE');
      setUsage(defaultUsage);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/usage?userId=${encodeURIComponent(user.id)}`, { cache: 'no-store' });
      if (!response.ok) {
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      setPlan((data?.plan || 'FREE') as PlanType);
      setUsage({
        current: data?.usage?.agentRuns ?? 0,
        limit: data?.usage?.limit ?? 10,
        remaining: data?.usage?.remaining ?? 10,
        lastResetDate: data?.usage?.lastResetDate ?? defaultUsage.lastResetDate,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onUsageUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ usage?: Partial<UsageState>; plan?: PlanType }>).detail;
      if (!detail) return;

      if (detail.plan === 'FREE' || detail.plan === 'PREMIUM') {
        setPlan(detail.plan);
      }

      if (detail.usage) {
        setUsage((prev) => ({
          current: typeof detail.usage.current === 'number' ? detail.usage.current : prev.current,
          limit: typeof detail.usage.limit === 'number' ? detail.usage.limit : prev.limit,
          remaining: typeof detail.usage.remaining === 'number' ? detail.usage.remaining : prev.remaining,
          lastResetDate: detail.usage.lastResetDate || prev.lastResetDate,
        }));
      }
    };

    window.addEventListener('kivo-usage-updated', onUsageUpdated as EventListener);
    return () => window.removeEventListener('kivo-usage-updated', onUsageUpdated as EventListener);
  }, []);

  return {
    user,
    plan,
    usage,
    isLoading,
    refresh,
    isPremium: plan === 'PREMIUM',
    isLimitReached: usage.current >= usage.limit,
  };
}
