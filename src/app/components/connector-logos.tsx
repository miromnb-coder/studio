'use client';

export function ConnectorLogo({ name }: { name: 'Gmail' | 'Google Calendar' | 'Google Drive' | 'GitHub' | 'Outlook' | 'Browser' }) {
  const base = 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#e8ebf0] bg-white';

  if (name === 'Gmail') return <span className={base}><span className="text-sm font-bold text-[#ea4335]">M</span></span>;
  if (name === 'Google Calendar') return <span className={base}><span className="text-sm font-bold text-[#4285f4]">31</span></span>;
  if (name === 'Google Drive') return <span className={base}><span className="text-sm font-bold text-[#0f9d58]">△</span></span>;
  if (name === 'GitHub') return <span className={base}><span className="text-sm font-bold text-[#111111]">GH</span></span>;
  if (name === 'Outlook') return <span className={base}><span className="text-sm font-bold text-[#0078d4]">O</span></span>;
  return <span className={base}><span className="text-sm font-bold text-[#7c8798]">◎</span></span>;
}
