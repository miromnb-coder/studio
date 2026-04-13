'use client';

import { useRouter } from 'next/navigation';
import { AppShell, PremiumCard, ProductPageHeader, SmartButton } from '@/app/components/premium-ui';

export default function SubscriptionControlPage() {
  const router = useRouter();
  return (
    <AppShell>
      <ProductPageHeader pageTitle="Subscription" pageSubtitle="Billing and upgrade flow" showBack />
      <PremiumCard className="space-y-3 p-4">
        <SmartButton className="w-full" onClick={() => router.push('/upgrade')}>Open billing / upgrade</SmartButton>
      </PremiumCard>
    </AppShell>
  );
}
