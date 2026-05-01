'use client';

import { useEffect, useRef, useState } from 'react';
import { c, MONO } from '@/lib/data';
import { usePassageStore } from '@/lib/store';

const FONT_SIZES = [
  { value: 14, label: 'Compact' },
  { value: 16, label: 'Default' },
  { value: 18, label: 'Large' },
  { value: 20, label: 'Extra large' },
] as const;

function SunIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function TextIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 7V5h16v2" />
      <path d="M9 20h6" />
      <path d="M12 5v15" />
    </svg>
  );
}

export default function FloatingControls() {
  const _hasHydrated = usePassageStore(s => s._hasHydrated);
  const theme        = usePassageStore(s => s.theme);
  const fontSize     = usePassageStore(s => s.fontSize);
  const toggleTheme  = usePassageStore(s => s.toggleTheme);
  const setFontSize  = usePassageStore(s => s.setFontSize);

  const [textOpen, setTextOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setTextOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  if (!_hasHydrated) return null;

  const btnStyle: React.CSSProperties = {
    width: 38, height: 38,
    background: c.bg,
    border: `1px solid ${c.ghost}`,
    color: c.fg,
    fontFamily: MONO,
    fontSize: '0.6875rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, border-color 0.15s',
  };

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'fixed',
        right: 'calc(16px + var(--safe-right))',
        bottom: 'calc(16px + var(--safe-bottom))',
        zIndex: 200,
        display: 'flex',
        gap: 8,
        flexDirection: 'column',
        alignItems: 'flex-end',
        fontFamily: MONO,
      }}
    >
      {/* Text size dropdown — opens upward */}
      {textOpen && (
        <div
          style={{
            background: c.bg,
            border: `1px solid ${c.ghost}`,
            padding: 6,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 4,
            minWidth: 200,
            boxShadow: theme === 'light' ? '0 6px 24px rgba(0,0,0,0.08)' : '0 6px 24px rgba(0,0,0,0.6)',
          }}
        >
          {FONT_SIZES.map(s => {
            const active = fontSize === s.value;
            return (
              <button
                key={s.value}
                onClick={() => { setFontSize(s.value); setTextOpen(false); }}
                style={{
                  background: active ? c.fg : 'transparent',
                  color: active ? c.bg : c.fg,
                  border: `1px solid ${active ? c.fg : c.ghost}`,
                  padding: '8px 6px',
                  cursor: 'pointer',
                  fontFamily: MONO,
                  fontSize: '0.6875rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: s.value, fontFamily: MONO, lineHeight: 1 }}>Aa</span>
                <span style={{ fontSize: '0.5rem', opacity: 0.85 }}>{s.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Button row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          aria-label="Toggle text size"
          onClick={() => setTextOpen(o => !o)}
          style={{
            ...btnStyle,
            borderColor: textOpen ? c.fg : c.ghost,
          }}
          title="Text size"
        >
          <TextIcon size={15} />
        </button>
        <button
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
          style={btnStyle}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
        </button>
      </div>
    </div>
  );
}
