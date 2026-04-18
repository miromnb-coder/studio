import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

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
        <svg
          width="180"
          height="180"
          viewBox="0 0 1024 1024"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="1024" height="1024" fill="#E9E9E7" />

          <rect
            x="112"
            y="104"
            width="800"
            height="816"
            rx="164"
            fill="#F5F5F3"
          />

          <g
            stroke="#040B18"
            strokeWidth="38"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="square"
          >
            <rect x="294" y="294" width="124" height="124" rx="12" />
            <rect x="606" y="294" width="124" height="124" rx="12" />
            <rect x="294" y="606" width="124" height="124" rx="12" />
            <rect x="606" y="606" width="124" height="124" rx="12" />

            <line x1="294" y1="512" x2="176" y2="512" />
            <line x1="848" y1="512" x2="730" y2="512" />
            <line x1="512" y1="294" x2="512" y2="176" />
            <line x1="512" y1="848" x2="512" y2="730" />

            <line x1="418" y1="418" x2="454" y2="454" />
            <line x1="606" y1="418" x2="570" y2="454" />
            <line x1="418" y1="606" x2="454" y2="570" />
            <line x1="606" y1="606" x2="570" y2="570" />
          </g>

          <circle
            cx="512"
            cy="512"
            r="116"
            fill="#F5F5F3"
            stroke="#040B18"
            strokeWidth="38"
          />
          <circle cx="512" cy="512" r="52" fill="#040B18" />
        </svg>
      </div>
    ),
    {
      ...size,
    },
  );
}
