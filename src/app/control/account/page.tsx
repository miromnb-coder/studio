'use client';

import { useRouter } from 'next/navigation';
import { AppShell, PremiumCard, ProductPageHeader, SmartButton } from '@/app/components/premium-ui';

export default function AccountControlPage() {
  const router = useRouter();
  return (
    <AppShell>
      <ProductPageHeader pageTitle="Account" pageSubtitle="Profile, identity, and security" showBack />
      <PremiumCard className="space-y-3 p-4">
        <SmartButton className="w-full" onClick={() => router.push('/profile')}>Open profile</SmartButton>
        <SmartButton className="w-full" variant="secondary" onClick={() => router.push('/login')}>Security and sign in</SmartButton>
      </PremiumCard>
    </AppShell>
  );
}
