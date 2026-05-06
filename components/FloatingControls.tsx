'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { usePassageStore } from '@/lib/store';

type SpeechRecognitionConstructor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

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

function HandIcon({ size = 14 }: { size?: number }) {
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
      <path d="M18 11V6a2 2 0 0 0-4 0v5" />
      <path d="M14 10V4a2 2 0 0 0-4 0v6" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  );
}

const BTN =
  'flex h-[38px] w-[38px] cursor-pointer items-center justify-center border bg-bg font-mono text-[0.6875rem] text-fg transition-colors';

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null;
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

function primeSpeechRecognition() {
  const Recognition = getSpeechRecognition();
  if (!Recognition) return;

  try {
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onend = null;
    recognition.onerror = null;
    recognition.start();
    window.setTimeout(() => recognition.stop(), 80);
  } catch {
    // Browsers that require a stronger user gesture will retry on field focus.
  }
}

function runThemeTransition(updateTheme: () => void) {
  if (!document.startViewTransition) {
    updateTheme();
    return;
  }

  document.startViewTransition(() => flushSync(updateTheme));
}

export default function FloatingControls() {
  const _hasHydrated = usePassageStore(s => s._hasHydrated);
  const theme = usePassageStore(s => s.theme);
  const fontSize = usePassageStore(s => s.fontSize);
  const toggleTheme = usePassageStore(s => s.toggleTheme);
  const setFontSize = usePassageStore(s => s.setFontSize);
  const gestureEnabled = usePassageStore(s => s.gestureEnabled);
  const setGestureEnabled = usePassageStore(s => s.setGestureEnabled);

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
      className="fixed bottom-[calc(64px+var(--safe-bottom))] left-1/2 z-[220] flex -translate-x-1/2 flex-col items-center gap-2 font-mono md:bottom-[calc(16px+var(--safe-bottom))] md:left-auto md:right-[calc(16px+var(--safe-right))] md:translate-x-0 md:items-end"
    >
      {textOpen && (
        <div
          className="grid min-w-[200px] grid-cols-2 gap-1 border border-ghost bg-bg p-1.5"
          style={{
            boxShadow: '0 6px 24px color-mix(in srgb, var(--c-fg) 18%, transparent)',
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
          aria-label={gestureEnabled ? 'Disable gesture control' : 'Enable gesture control'}
          onClick={() => {
            if (!gestureEnabled) primeSpeechRecognition();
            setGestureEnabled(!gestureEnabled);
          }}
          className={`${BTN} ${gestureEnabled ? 'border-fg bg-fg !text-bg' : 'border-ghost'}`}
          title={gestureEnabled ? 'Stop gesture control' : 'Start gesture control'}
        >
          <HandIcon size={15} />
        </button>
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
          onClick={() => runThemeTransition(toggleTheme)}
          className={`${BTN} border-ghost`}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
        </button>
      </div>
    </div>
  );
}
