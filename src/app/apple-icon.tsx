import { ImageResponse } from 'next/og';

export const runtime = 'edge';

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
          width: '180px',
          height: '180px',
          background: '#ffffff',
          borderRadius: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="128" height="128" viewBox="0 0 512 512">
          <g fill="#050505">
            <circle cx="256" cy="92" r="6" />
            <circle cx="298" cy="102" r="10" />
            <circle cx="337" cy="122" r="14" />
            <circle cx="371" cy="153" r="17" />
            <circle cx="395" cy="193" r="18" />
            <circle cx="406" cy="238" r="15" />
            <circle cx="403" cy="285" r="12" />
            <circle cx="386" cy="328" r="9" />
            <circle cx="356" cy="365" r="7" />
            <circle cx="317" cy="392" r="6" />
            <circle cx="270" cy="404" r="8" />
            <circle cx="224" cy="397" r="12" />
            <circle cx="181" cy="377" r="16" />
            <circle cx="146" cy="343" r="18" />
            <circle cx="123" cy="300" r="17" />
            <circle cx="116" cy="252" r="14" />
            <circle cx="126" cy="205" r="10" />
            <circle cx="151" cy="164" r="7" />

            <circle cx="227" cy="121" r="8" />
            <circle cx="270" cy="123" r="13" />
            <circle cx="312" cy="136" r="17" />
            <circle cx="349" cy="163" r="19" />
            <circle cx="374" cy="201" r="18" />
            <circle cx="384" cy="246" r="14" />
            <circle cx="378" cy="291" r="10" />
            <circle cx="357" cy="331" r="7" />
            <circle cx="322" cy="361" r="6" />
            <circle cx="279" cy="376" r="9" />
            <circle cx="234" cy="374" r="13" />
            <circle cx="191" cy="357" r="17" />
            <circle cx="157" cy="326" r="19" />
            <circle cx="136" cy="284" r="18" />
            <circle cx="134" cy="238" r="14" />
            <circle cx="150" cy="194" r="10" />
            <circle cx="180" cy="157" r="7" />

            <circle cx="249" cy="154" r="10" />
            <circle cx="289" cy="159" r="15" />
            <circle cx="325" cy="178" r="18" />
            <circle cx="352" cy="211" r="18" />
            <circle cx="363" cy="252" r="14" />
            <circle cx="357" cy="293" r="10" />
            <circle cx="335" cy="329" r="7" />
            <circle cx="299" cy="351" r="7" />
            <circle cx="257" cy="358" r="10" />
            <circle cx="216" cy="348" r="15" />
            <circle cx="181" cy="323" r="18" />
            <circle cx="158" cy="286" r="18" />
            <circle cx="155" cy="243" r="14" />
            <circle cx="172" cy="202" r="10" />
            <circle cx="205" cy="171" r="7" />
          </g>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
