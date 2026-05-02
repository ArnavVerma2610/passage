'use client';

import { useEffect, useRef, useState } from 'react';
import { usePassageStore } from '@/lib/store';

const FONT_SIZES = [
  { value: 14, label: 'Compact' },
  { value: 16, label: 'Default' },
  { value: 18, label: 'Large' },
  { value: 20, label: 'Extra large' },
] as const;

function SunIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function TextIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7V5h16v2" />
      <path d="M9 20h6" />
      <path d="M12 5v15" />
    </svg>
  );
}

const BTN =
  'flex h-[38px] w-[38px] cursor-pointer items-center justify-center border bg-bg font-mono text-[0.6875rem] text-fg transition-colors';

export default function FloatingControls() {
  const _hasHydrated = usePassageStore(s => s._hasHydrated);
  const theme = usePassageStore(s => s.theme);
  const fontSize = usePassageStore(s => s.fontSize);
  const toggleTheme = usePassageStore(s => s.toggleTheme);
  const setFontSize = usePassageStore(s => s.setFontSize);

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

  return (
    <div
      ref={wrapRef}
      className="fixed z-[200] flex flex-col items-end gap-2 font-mono"
      style={{
        right: 'calc(16px + var(--safe-right))',
        bottom: 'calc(16px + var(--safe-bottom))',
      }}
    >
      {textOpen && (
        <div
          className="grid min-w-[200px] grid-cols-2 gap-1 border border-ghost bg-bg p-1.5"
          style={{
            boxShadow:
              theme === 'light' ? '0 6px 24px rgba(0,0,0,0.08)' : '0 6px 24px rgba(0,0,0,0.6)',
          }}
        >
          {FONT_SIZES.map(s => {
            const active = fontSize === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  setFontSize(s.value);
                  setTextOpen(false);
                }}
                className={`flex cursor-pointer flex-col items-center gap-1 border px-1.5 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.06em] ${
                  active ? 'border-fg bg-fg text-bg' : 'border-ghost bg-transparent text-fg'
                }`}
              >
                <span className="font-mono leading-none" style={{ fontSize: s.value }}>
                  Aa
                </span>
                <span className="text-[0.5rem] opacity-85">{s.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Toggle text size"
          onClick={() => setTextOpen(o => !o)}
          className={`${BTN} ${textOpen ? 'border-fg' : 'border-ghost'}`}
          title="Text size"
        >
          <TextIcon size={15} />
        </button>
        <button
          type="button"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
          className={`${BTN} border-ghost`}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
        </button>
      </div>
    </div>
  );
}
