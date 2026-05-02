'use client';

import { usePassageStore } from '@/lib/store';

const SIZES = [
  { value: 14, label: 'Compact' },
  { value: 16, label: 'Default' },
  { value: 18, label: 'Large' },
  { value: 20, label: 'Extra large' },
] as const;

export default function FontSizeModal() {
  const _hasHydrated = usePassageStore(s => s._hasHydrated);
  const fontSizeSet = usePassageStore(s => s.fontSizeSet);
  const fontSize = usePassageStore(s => s.fontSize);
  const setFontSize = usePassageStore(s => s.setFontSize);
  const confirmFontSize = usePassageStore(s => s.confirmFontSize);

  if (!_hasHydrated || fontSizeSet) return null;

  return (
    <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-bg/95 px-6 font-mono">
      <div className="w-full max-w-[420px]">
        <div className="mb-2.5 text-[0.625rem] uppercase tracking-[0.2em] text-faint">
          Before we begin
        </div>
        <div className="mb-1.5 text-[1.375rem]">Choose your text size</div>
        <p className="mb-8 text-sm leading-relaxed text-dim">
          Readable text matters. Pick what feels right. You can change this anytime from your
          profile.
        </p>

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
