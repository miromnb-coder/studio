'use client';

import { Globe } from 'lucide-react';

type ConnectorName =
  | 'Gmail'
  | 'Google Calendar'
  | 'Google Drive'
  | 'GitHub'
  | 'Outlook'
  | 'Browser';

export function ConnectorLogo({
  name,
}: {
  name: ConnectorName;
}) {
  const wrap = (content: React.ReactNode) => (
    <span className="flex h-5 w-5 items-center justify-center">
      {content}
    </span>
  );

  if (name === 'Gmail') {
    return wrap(
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path fill="#EA4335" d="M3 6.5 12 13l9-6.5V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.5Z" />
        <path fill="#34A853" d="M21 6.5V18a2 2 0 0 1-2 2h-1V9.5l3-3Z" />
        <path fill="#4285F4" d="M3 6.5v11a2 2 0 0 0 2 2h1V9.5l-3-3Z" />
        <path fill="#FBBC04" d="M21 6.5 12 13 3 6.5 5.2 4.8A2 2 0 0 1 6.4 4h11.2a2 2 0 0 1 1.2.8L21 6.5Z" />
        <path fill="#fff" d="M6 9.5 12 14l6-4.5V20H6V9.5Z" />
      </svg>,
    );
  }

  if (name === 'Google Calendar') {
    return wrap(
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <rect x="3" y="4" width="18" height="17" rx="4" fill="#4285F4" />
        <rect x="3" y="7" width="18" height="3" fill="#AECBFA" />
        <text
          x="12"
          y="18"
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill="white"
          fontFamily="Arial, sans-serif"
        >
          31
        </text>
      </svg>,
    );
  }

  if (name === 'Google Drive') {
    return wrap(
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path fill="#0F9D58" d="M9 3h6l6 10h-6L9 3Z" />
        <path fill="#4285F4" d="M3 13 9 3l3 5-6 10-3-5Z" />
        <path fill="#F4B400" d="M6 18h12l3-5H9l-3 5Z" />
      </svg>,
    );
  }

  if (name === 'GitHub') {
    return wrap(
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="#111111"
          d="M12 .7a11.3 11.3 0 0 0-3.57 22.02c.56.1.76-.24.76-.54v-1.9c-3.1.68-3.75-1.3-3.75-1.3-.5-1.28-1.23-1.62-1.23-1.62-1-.7.08-.69.08-.69 1.1.08 1.67 1.14 1.67 1.14.98 1.68 2.57 1.2 3.2.92.1-.71.39-1.2.7-1.47-2.47-.28-5.08-1.23-5.08-5.5 0-1.22.44-2.22 1.15-3-.11-.28-.5-1.42.11-2.96 0 0 .94-.3 3.08 1.14a10.7 10.7 0 0 1 5.6 0c2.14-1.44 3.08-1.14 3.08-1.14.61 1.54.22 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.28-2.62 5.21-5.11 5.48.4.35.75 1.03.75 2.08v3.08c0 .3.2.65.77.54A11.3 11.3 0 0 0 12 .7Z"
        />
      </svg>,
    );
  }

  if (name === 'Outlook') {
    return wrap(
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <rect x="3" y="6" width="10" height="12" rx="2" fill="#0078D4" />
        <rect x="11" y="8" width="10" height="10" rx="2" fill="#1A5FB4" />
        <text
          x="8"
          y="14.5"
          textAnchor="middle"
          fontSize="7"
          fontWeight="700"
          fill="white"
          fontFamily="Arial, sans-serif"
        >
          O
        </text>
      </svg>,
    );
  }

  return wrap(
    <Globe
      className="h-4.5 w-4.5 text-[#64748b]"
      strokeWidth={1.9}
    />,
  );
}
