import { Suspense } from 'react';
import ActionsPageClient from './ActionsPageClient';

export default function ActionsPage() {
  return (
    <Suspense fallback={null}>
      <ActionsPageClient />
    </Suspense>
  );
}
