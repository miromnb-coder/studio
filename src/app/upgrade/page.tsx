import { Suspense } from 'react';
import { KivoUpgradeScreen } from '@/components/chat/kivo/KivoUpgradeScreen';

export const dynamic = 'force-dynamic';

export default function UpgradePage() {
  return (
    <Suspense fallback={null}>
      <KivoUpgradeScreen />
    </Suspense>
  );
}
