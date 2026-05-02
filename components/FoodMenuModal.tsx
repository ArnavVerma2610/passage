'use client';

import { useEffect } from 'react';
import type { FoodSpot } from '@/lib/types';

interface FoodMenuModalProps {
  spot: FoodSpot;
  onClose: () => void;
}

export function priceDollars(level: 1 | 2 | 3 | 4) {
  return '$'.repeat(level);
}

export default function FoodMenuModal({ spot, onClose }: FoodMenuModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[250] flex items-center justify-center bg-scrim p-5 font-mono"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-[560px] overflow-y-auto border border-ghost bg-bg p-7"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
              {spot.type}
            </div>
            <div className="text-[1.375rem] leading-tight text-fg">{spot.name}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border border-ghost bg-transparent font-mono text-sm text-faint"
          >
            ✕
          </button>
        </div>

        <div className="mb-[18px] flex flex-wrap gap-2">
          <span className="border border-ghost px-2.5 py-1 text-[0.625rem] tracking-[0.08em] text-fg">
            {priceDollars(spot.priceLevel)}
          </span>
          <span className="border border-ghost px-2.5 py-1 text-[0.625rem] tracking-[0.05em] text-faint">
            📍 {spot.map}
          </span>
        </div>

        <div className="mb-3.5 text-sm leading-relaxed text-dim">{spot.desc}</div>

        <div className="mb-[18px] border-l-2 border-fg bg-surface px-3.5 py-3 text-[0.8125rem] italic leading-relaxed text-sub">
          Fun fact — {spot.funFact}
        </div>

        <div className="mb-[22px] text-[0.6875rem] text-faint">
          submitted by <span className="text-dim">{spot.submittedBy}</span>
        </div>

        <div className="mb-3 text-[0.5625rem] uppercase tracking-[0.18em] text-faint">Menu</div>
        <div className="border-t border-ghost">
          {spot.menu.map((item, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-4 border-b border-ghost py-3.5"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 text-sm text-fg">{item.name}</div>
                <div className="text-xs leading-snug text-dim">{item.desc}</div>
              </div>
              <div className="shrink-0 whitespace-nowrap text-[0.8125rem] text-sub">
                {item.price}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
