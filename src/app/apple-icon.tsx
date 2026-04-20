import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

function AppleLogo() {
  return (
    <svg
      width="180"
      height="180"
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="1024" height="1024" fill="#E9E9E7" />
      <rect x="112" y="112" width="800" height="800" rx="176" fill="#F5F5F3" />

      <path
        d="M248 654C283 704 366 730 485 724C626 717 750 643 831 542C872 490 892 434 887 388C883 361 873 339 854 321"
        stroke="#040B18"
        strokeWidth="42"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <path
        d="M430 501L589 362"
        stroke="#040B18"
        strokeWidth="54"
        strokeLinecap="round"
        fill="none"
      />

      <circle cx="404" cy="522" r="92" fill="#040B18" />
      <circle cx="640" cy="334" r="150" fill="#040B18" />
    </svg>
  );
}

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#E9E9E7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppleLogo />
      </div>
    ),
    {
      ...size,
    },
  );
}
