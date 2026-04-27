import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '180px', height: '180px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="172" height="172" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="#050505" strokeLinecap="round" strokeLinejoin="round">
            <path d="M128 356V244c0-44 24-83 59-114l28-25c24-21 58-21 82 0l28 25c35 31 59 70 59 114v112" strokeWidth="54" />
            <path d="M178 336v-88c0-31 17-59 42-80l13-11c13-11 33-11 46 0l13 11c25 21 42 49 42 80v88" strokeWidth="34" />
          </g>
          <circle cx="256" cy="300" r="43" fill="#050505" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
