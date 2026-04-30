'use client';

import { c, MONO } from '@/lib/data';
import { usePassageStore } from '@/lib/store';

const SIZES = [
  { value: 14, label: 'Compact' },
  { value: 16, label: 'Default' },
  { value: 18, label: 'Large' },
  { value: 20, label: 'Extra large' },
] as const;

export default function FontSizeModal() {
  const _hasHydrated  = usePassageStore(s => s._hasHydrated);
  const fontSizeSet   = usePassageStore(s => s.fontSizeSet);
  const fontSize      = usePassageStore(s => s.fontSize);
  const setFontSize   = usePassageStore(s => s.setFontSize);
  const confirmFontSize = usePassageStore(s => s.confirmFontSize);

  if (!_hasHydrated || fontSizeSet) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)',
      zIndex: 500, display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', padding: '0 24px',
      fontFamily: MONO,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ fontSize: '0.625rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: c.faint, marginBottom: 10 }}>
          Before we begin
        </div>
        <div style={{ fontSize: '1.375rem', marginBottom: 6 }}>
          Choose your text size
        </div>
        <div style={{ fontSize: '0.875rem', color: c.dim, marginBottom: 32, lineHeight: 1.6 }}>
          Readable text matters. Pick what feels right. You can change this anytime from your profile.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 28 }}>
          {SIZES.map(s => {
            const active = fontSize === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setFontSize(s.value)}
                style={{
                  background: active ? '#111' : 'none',
                  border: `1px solid ${active ? c.fg : c.ghost}`,
                  cursor: 'pointer', padding: '20px 12px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: s.value + 'px', color: c.fg, lineHeight: 1 }}>Aa</span>
                <span style={{ fontSize: '0.6875rem', color: active ? c.sub : c.faint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: '0.875rem', color: c.dim, background: c.surface, padding: '14px 16px', borderLeft: `2px solid ${c.ghost}`, marginBottom: 24, lineHeight: 1.6, fontStyle: 'italic' }}>
          "The world isn't the same size for everyone."
        </div>

        <button
          onClick={confirmFontSize}
          style={{
            width: '100%', padding: '15px', background: c.fg, color: c.bg,
            fontFamily: MONO, fontSize: '0.75rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', border: 'none', cursor: 'pointer',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
