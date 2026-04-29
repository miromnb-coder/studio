import { Suspense } from 'react';
import { ActionsPageClient } from './ActionsPageClient';

export const dynamic = 'force-dynamic';

export default function ActionsPage() {
  return (
    <Suspense fallback={null}>
      <ActionsPageClient />
    </Suspense>
  );
}
