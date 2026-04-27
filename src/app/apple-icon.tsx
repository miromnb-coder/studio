import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '180px', height: '180px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/apple-touch-icon.png?v=11" width="150" height="150" />
      </div>
    ),
    { ...size }
  );
}
