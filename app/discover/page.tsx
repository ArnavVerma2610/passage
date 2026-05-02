'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SwipeDeck from '@/components/SwipeDeck';
import { COUNTRIES_ACCESS } from '@/lib/data';
import { usePassageStore } from '@/lib/store';
import { computeAmpScore, getTier, TIER_META } from '@/lib/amp';

export default function DiscoverPage() {
  const router = useRouter();

  const _hasHydrated = usePassageStore(s => s._hasHydrated);
  const passport = usePassageStore(s => s.passport);
  const amp = usePassageStore(s => s.amp);

  useEffect(() => {
    if (_hasHydrated && !passport) router.replace('/');
  }, [_hasHydrated, passport, router]);

  if (!_hasHydrated || !passport) return null;

  const country = COUNTRIES_ACCESS[passport];
  const score = computeAmpScore(amp);
  const tier = getTier(score);
  const meta = TIER_META[tier];

  return (
    <div className="min-h-screen pb-[100px] text-sm">
      <div className="sticky top-0 z-10 border-b border-ghost bg-bg px-6 pb-5 pt-6">
        <div className="mx-auto flex max-w-[540px] flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 text-[0.5625rem] uppercase tracking-[0.18em] text-faint">
              Discover
            </div>
            <div className="text-base leading-snug text-fg">Swipe right to save, left to skip</div>
            <div className="mt-1 text-[0.6875rem] text-faint">
              Visa probability calibrated to your AMP tier and {country?.name} passport
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div
              className="mb-1 inline-block border px-2 py-[3px] text-[0.625rem] tracking-[0.1em]"
              style={{ borderColor: meta.color, color: meta.color }}
            >
              {meta.short}
            </div>
            <div className="text-[0.6875rem] text-faint">AMP {score}/1000</div>
          </div>
        </div>
      </div>

      <SwipeDeck passport={passport} />
    </div>
  );
}
