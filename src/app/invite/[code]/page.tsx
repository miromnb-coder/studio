import { Suspense } from 'react';
import { KivoInviteScreen } from '@/components/chat/kivo/KivoInviteScreen';

export const dynamic = 'force-dynamic';

type InvitePageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;

  return (
    <Suspense fallback={null}>
      <KivoInviteScreen code={code} />
    </Suspense>
  );
}
