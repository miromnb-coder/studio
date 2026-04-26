import { KivoUsageSheet } from '@/components/chat/kivo/KivoUsageSheet';

async function getCredits() {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || '';
    const res = await fetch(`${base}/api/credits`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch {}
  return { credits: 100, plan: 'free' };
}

export default async function UsagePage() {
  const account = await getCredits();
  return <KivoUsageSheet open={true} onClose={() => {}} onUpgrade={() => {}} account={account} credits={account.credits ?? 100} />;
}
