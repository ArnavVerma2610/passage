'use client';

import { c, MONO } from '@/lib/data';

interface TopBarProps {
  title?: string;
  right?: string;
  onBack?: () => void;
}

export default function TopBar({ title, right, onBack }: TopBarProps) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '16px 24px', borderBottom: `1px solid ${c.ghost}`,
      position: 'sticky', top: 0, background: c.bg, zIndex: 100,
    }}>
      {onBack ? (
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: c.dim, fontFamily: MONO, fontSize: '0.8125rem', cursor: 'pointer', padding: 0 }}
        >
          ← back
        </button>
      ) : (
        <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: c.fg, fontFamily: MONO }}>
          {title}
        </div>
      )}
      {right && <div style={{ fontSize: '0.6875rem', color: c.faint, fontFamily: MONO }}>{right}</div>}
    </div>
  );
}
