'use client';

import { Search } from 'lucide-react';
import type { ReactNode } from 'react';

type ConnectorName =
  | 'Gmail'
  | 'Google Calendar'
  | 'Google Drive'
  | 'GitHub'
  | 'Outlook'
  | 'Browser';

export function ConnectorLogo({ name }: { name: ConnectorName }) {
  const wrap = (content: ReactNode) => (
    <span className="flex h-6 w-6 items-center justify-center drop-shadow-[0_2px_5px_rgba(15,23,42,0.08)]">
      {content}
    </span>
  );

  if (name === 'Gmail') {
    return wrap(
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
        <defs>
          <linearGradient id="gmail-red" x1="6" y1="5" x2="23" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF8A80" />
            <stop offset="0.52" stopColor="#EA4335" />
            <stop offset="1" stopColor="#C5221F" />
          </linearGradient>
          <linearGradient id="gmail-blue" x1="5" y1="10" x2="11" y2="27" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7BAAF7" />
            <stop offset="1" stopColor="#1A73E8" />
          </linearGradient>
          <linearGradient id="gmail-green" x1="27" y1="10" x2="20" y2="27" gradientUnits="userSpaceOnUse">
            <stop stopColor="#81C995" />
            <stop offset="1" stopColor="#188038" />
          </linearGradient>
          <linearGradient id="gmail-yellow" x1="8" y1="6" x2="23" y2="12" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDD663" />
            <stop offset="1" stopColor="#FBBC04" />
          </linearGradient>
        </defs>
        <path d="M5 9.7c0-1.9 2.15-3 3.68-1.88L16 13.12l7.32-5.3C24.85 6.7 27 7.8 27 9.7v13.1A3.2 3.2 0 0 1 23.8 26H8.2A3.2 3.2 0 0 1 5 22.8V9.7Z" fill="white" />
        <path d="M5 9.8 16 18.1 27 9.8v4.75L16 22.8 5 14.55V9.8Z" fill="url(#gmail-red)" />
        <path d="M5 10.25v12.4A3.35 3.35 0 0 0 8.35 26H10.2V14.2L5 10.25Z" fill="url(#gmail-blue)" />
        <path d="M27 10.25v12.4A3.35 3.35 0 0 1 23.65 26H21.8V14.2L27 10.25Z" fill="url(#gmail-green)" />
        <path d="M7.95 7.38 16 13.18l8.05-5.8A2.35 2.35 0 0 1 27 9.28v.95L16 18.5 5 10.23v-.95a2.35 2.35 0 0 1 2.95-1.9Z" fill="url(#gmail-yellow)" />
        <path d="M5 10.23 16 18.5 27 10.23v4.34L16 22.85 5 14.57v-4.34Z" fill="url(#gmail-red)" fillOpacity="0.9" />
      </svg>,
    );
  }

  if (name === 'Google Calendar') {
    return wrap(
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
        <defs>
          <linearGradient id="calendar-blue" x1="6" y1="5" x2="26" y2="27" gradientUnits="userSpaceOnUse">
            <stop stopColor="#AECBFA" />
            <stop offset="0.42" stopColor="#4285F4" />
            <stop offset="1" stopColor="#1967D2" />
          </linearGradient>
        </defs>
        <rect x="5" y="5" width="22" height="22" rx="6" fill="url(#calendar-blue)" />
        <path d="M5 11h22v4H5v-4Z" fill="white" fillOpacity="0.34" />
        <path d="M11 4.5v4M21 4.5v4" stroke="#185ABC" strokeWidth="2.2" strokeLinecap="round" />
        <text x="16" y="23" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="white" fontFamily="Arial, sans-serif">31</text>
      </svg>,
    );
  }

  if (name === 'Google Drive') {
    return wrap(
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
        <defs>
          <linearGradient id="drive-green" x1="9" y1="5" x2="22" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#81C995" />
            <stop offset="1" stopColor="#188038" />
          </linearGradient>
          <linearGradient id="drive-yellow" x1="11" y1="4" x2="27" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDD663" />
            <stop offset="1" stopColor="#F9AB00" />
          </linearGradient>
          <linearGradient id="drive-blue" x1="5" y1="16" x2="25" y2="27" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8AB4F8" />
            <stop offset="1" stopColor="#1A73E8" />
          </linearGradient>
        </defs>
        <path d="M12.3 5.5h7.4l8.1 14.1h-7.45L12.3 5.5Z" fill="url(#drive-yellow)" />
        <path d="M4.2 19.6 12.3 5.5l4.05 7.05-8.1 14.1L4.2 19.6Z" fill="url(#drive-green)" />
        <path d="M8.25 26.65h16.2l3.35-7.05H11.6l-3.35 7.05Z" fill="url(#drive-blue)" />
      </svg>,
    );
  }

  if (name === 'GitHub') {
    return wrap(
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="#111111" />
        <path
          fill="white"
          d="M16 7.1a9.1 9.1 0 0 0-2.88 17.73c.45.08.61-.2.61-.44v-1.53c-2.5.54-3.02-1.05-3.02-1.05-.41-1.03-.99-1.3-.99-1.3-.81-.56.06-.55.06-.55.89.06 1.35.92 1.35.92.79 1.35 2.07.96 2.58.73.08-.57.31-.96.56-1.18-1.99-.23-4.09-.99-4.09-4.43 0-.98.35-1.79.93-2.42-.1-.23-.41-1.14.09-2.38 0 0 .76-.24 2.48.92a8.62 8.62 0 0 1 4.51 0c1.72-1.16 2.48-.92 2.48-.92.5 1.24.19 2.15.09 2.38.58.63.93 1.44.93 2.42 0 3.45-2.11 4.2-4.11 4.42.32.28.6.83.6 1.67v2.48c0 .24.16.52.62.44A9.1 9.1 0 0 0 16 7.1Z"
        />
      </svg>,
    );
  }

  if (name === 'Outlook') {
    return wrap(
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
        <defs>
          <linearGradient id="outlook-blue" x1="6" y1="7" x2="25" y2="25" gradientUnits="userSpaceOnUse">
            <stop stopColor="#41A5EE" />
            <stop offset="0.5" stopColor="#0078D4" />
            <stop offset="1" stopColor="#185ABD" />
          </linearGradient>
        </defs>
        <rect x="11" y="8" width="15" height="16" rx="3.5" fill="#0A5EB8" />
        <path d="M12.5 11.5h12v10h-12l6-5 6 5" fill="#37A1F2" fillOpacity="0.8" />
        <rect x="5" y="6" width="14" height="20" rx="4" fill="url(#outlook-blue)" />
        <text x="12" y="19" textAnchor="middle" fontSize="10" fontWeight="800" fill="white" fontFamily="Arial, sans-serif">O</text>
      </svg>,
    );
  }

  return wrap(
    <span className="grid h-6 w-6 place-items-center rounded-[8px] bg-[radial-gradient(circle_at_30%_20%,#e0f2fe,transparent_42%),linear-gradient(135deg,#0f172a,#2563eb_48%,#22d3ee)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
      <Search className="h-3.5 w-3.5" strokeWidth={2.4} />
    </span>,
  );
}
