'use client';

import type { ReactElement } from 'react';

interface FlagProps {
  code: string;
  size?: number;
}

const FLAGS: Record<string, (w: number, h: number) => ReactElement> = {
  IN: (w, h) => (
    <svg width={w} height={h} viewBox="0 0 48 32" fill="none">
      <rect width="48" height="10.67" fill="#FF9933" />
      <rect y="10.67" width="48" height="10.67" fill="#fff" />
      <rect y="21.33" width="48" height="10.67" fill="#138808" />
      <circle cx="24" cy="16" r="3.5" stroke="#000080" strokeWidth="0.8" fill="none" />
    </svg>
  ),
  NO: (w, h) => (
    <svg width={w} height={h} viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" fill="#BA0C2F" />
      <rect x="14" width="8" height="32" fill="#fff" />
      <rect y="12" width="48" height="8" fill="#fff" />
      <rect x="16" width="4" height="32" fill="#00205B" />
      <rect y="14" width="48" height="4" fill="#00205B" />
    </svg>
  ),
  NG: (w, h) => (
    <svg width={w} height={h} viewBox="0 0 48 32" fill="none">
      <rect width="16" height="32" fill="#008751" />
      <rect x="16" width="16" height="32" fill="#fff" />
      <rect x="32" width="16" height="32" fill="#008751" />
    </svg>
  ),
  PK: (w, h) => (
    <svg width={w} height={h} viewBox="0 0 48 32" fill="none">
      <rect width="12" height="32" fill="#fff" />
      <rect x="12" width="36" height="32" fill="#01411C" />
      <circle cx="28" cy="16" r="7" fill="#fff" />
      <circle cx="30" cy="16" r="5.5" fill="#01411C" />
      <polygon points="27,9 28.2,13 32,13 29,15.5 30,19.5 27,17" fill="#fff" />
    </svg>
  ),
  US: (w, h) => (
    <svg width={w} height={h} viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" fill="#B22234" />
      <rect y="2.46" width="48" height="2.46" fill="#fff" />
      <rect y="7.38" width="48" height="2.46" fill="#fff" />
      <rect y="12.31" width="48" height="2.46" fill="#fff" />
      <rect y="17.23" width="48" height="2.46" fill="#fff" />
      <rect y="22.15" width="48" height="2.46" fill="#fff" />
      <rect y="27.08" width="48" height="2.46" fill="#fff" />
      <rect width="19.2" height="17.23" fill="#3C3B6E" />
    </svg>
  ),
  SY: (w, h) => (
    <svg width={w} height={h} viewBox="0 0 48 32" fill="none">
      <rect width="48" height="10.67" fill="#CE1126" />
      <rect y="10.67" width="48" height="10.67" fill="#fff" />
      <rect y="21.33" width="48" height="10.67" fill="#000" />
      <circle cx="19" cy="16" r="2.2" fill="#007A3D" />
      <circle cx="29" cy="16" r="2.2" fill="#007A3D" />
    </svg>
  ),
};

function emojiFlag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...code.split('').map(ch => 127397 + ch.charCodeAt(0)));
}

export default function Flag({ code, size = 32 }: FlagProps) {
  const w = size;
  const h = size * 0.667;
  const render = FLAGS[code];

  if (render) {
    return (
      <div
        className="inline-flex items-center justify-center overflow-hidden rounded-sm"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {render(w, h)}
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center justify-center rounded-sm bg-surface-2"
      style={{
        width: w,
        height: h,
        border: '1px solid rgba(255,255,255,0.08)',
        fontSize: Math.round(h * 0.95),
        lineHeight: 1,
      }}
    >
      {emojiFlag(code)}
    </div>
  );
}
