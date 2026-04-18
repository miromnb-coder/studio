import { Suspense } from 'react';
import { ToolsPageClient } from './ToolsPageClient';

export const dynamic = 'force-dynamic';

export default function ToolsPage() {
  return (
    <Suspense fallback={null}>
      <ToolsPageClient />
    </Suspense>
  );
}
