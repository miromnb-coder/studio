'use client';

export function ConnectorLogo({ name }: { name: 'Gmail' | 'Google Calendar' | 'Google Drive' | 'GitHub' | 'Outlook' | 'Browser' }) {
  if (name === 'Gmail') return <span className="text-sm font-bold text-[#ea4335]">M</span>;
  if (name === 'Google Calendar') return <span className="text-sm font-bold text-[#4285f4]">31</span>;
  if (name === 'Google Drive') return <span className="text-sm font-bold text-[#0f9d58]">△</span>;
  if (name === 'GitHub') return <span className="text-sm font-bold text-[#111111]">GH</span>;
  if (name === 'Outlook') return <span className="text-sm font-bold text-[#0078d4]">O</span>;
  return <span className="text-sm font-bold text-[#7c8798]">◎</span>;
}
