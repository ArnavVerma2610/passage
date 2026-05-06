'use client';

import { usePassageStore } from '@/lib/store';

const SIZES = [
  { value: 14, label: 'Compact' },
  { value: 16, label: 'Default' },
  { value: 18, label: 'Large' },
  { value: 20, label: 'Extra large' },
] as const;

const COLOR_MODES = [
  { value: 'blue', label: 'Blue', desc: 'Blue base' },
  { value: 'mono', label: 'Mono', desc: 'Black base' },
] as const;

export default function FontSizeModal() {
  const _hasHydrated = usePassageStore(s => s._hasHydrated);
  const fontSizeSet = usePassageStore(s => s.fontSizeSet);
  const fontSize = usePassageStore(s => s.fontSize);
  const colorMode = usePassageStore(s => s.colorMode);
  const setFontSize = usePassageStore(s => s.setFontSize);
  const setColorMode = usePassageStore(s => s.setColorMode);
  const confirmFontSize = usePassageStore(s => s.confirmFontSize);

  if (!_hasHydrated || fontSizeSet) return null;

  return (
    <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-bg px-6 font-mono">
      <div className="w-full max-w-[420px]">
        <div className="mb-2.5 text-[0.625rem] uppercase tracking-[0.2em] text-faint">
          Before we begin
        </div>
        <div className="mb-1.5 text-[1.375rem]">Choose your access settings</div>
        <p className="mb-8 text-sm leading-relaxed text-dim">
          Readable text and clear contrast matter. Pick what feels right before you start.
        </p>

        <div className="mb-3 text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
          Colour mode
        </div>
        <div className="mb-7 grid grid-cols-2 gap-2">
          {COLOR_MODES.map(mode => {
            const active = colorMode === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => setColorMode(mode.value)}
                className={`flex cursor-pointer flex-col gap-2 border px-3 py-4 text-left transition-all ${
                  active ? 'border-fg bg-active' : 'border-ghost bg-transparent'
                }`}
              >
                <span className="flex gap-1.5" aria-hidden>
                  <span
                    className="inline-block h-4 w-4 border border-ghost"
                    style={{ background: mode.value === 'blue' ? '#114ED5' : '#000' }}
                  />
                  <span className="inline-block h-4 w-4 border border-ghost bg-bg" />
                  <span className="inline-block h-4 w-4 border border-ghost bg-fg" />
                </span>
                <span className="text-[0.6875rem] uppercase tracking-[0.08em] text-sub">
                  {mode.label}
                </span>
                <span className="text-[0.625rem] text-faint">{mode.desc}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-3 text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
          Text size
        </div>

        <div className="mb-7 grid grid-cols-2 gap-2">
          {SIZES.map(s => {
            const active = fontSize === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setFontSize(s.value)}
                className={`flex cursor-pointer flex-col items-center gap-2.5 border px-3 py-5 transition-all ${
                  active ? 'border-fg bg-active' : 'border-ghost bg-transparent'
                }`}
              >
                <span
                  className="font-mono leading-none text-fg"
                  style={{ fontSize: `${s.value}px` }}
                >
                  Aa
                </span>
                <span
                  className={`text-[0.6875rem] uppercase tracking-[0.08em] ${
                    active ? 'text-sub' : 'text-faint'
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mb-6 border-l-2 border-ghost bg-surface px-4 py-3.5 text-sm italic leading-relaxed text-dim">
          &ldquo;The world isn&apos;t the same size for everyone.&rdquo;
        </div>

        <button
          type="button"
          onClick={confirmFontSize}
          className="w-full cursor-pointer border-0 bg-fg p-[15px] font-mono text-xs uppercase tracking-[0.08em] text-bg"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
