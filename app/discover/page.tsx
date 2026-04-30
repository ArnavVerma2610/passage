'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SwipeDeck from '@/components/SwipeDeck';
import { c, MONO, COUNTRIES_ACCESS } from '@/lib/data';
import { usePassageStore } from '@/lib/store';
import { computeAmpScore, getTier, TIER_META } from '@/lib/amp';

export default function DiscoverPage() {
  const router = useRouter();

  const _hasHydrated = usePassageStore(s => s._hasHydrated);
  const passport     = usePassageStore(s => s.passport);
  const amp          = usePassageStore(s => s.amp);

  useEffect(() => {
    if (_hasHydrated && !passport) router.replace('/');
  }, [_hasHydrated, passport, router]);

  if (!_hasHydrated || !passport) return null;

  const country = COUNTRIES_ACCESS[passport];
  const score   = computeAmpScore(amp);
  const tier    = getTier(score);
  const meta    = TIER_META[tier];

  return (
    <div style={{ fontFamily: MONO, minHeight: '100vh', paddingBottom: 100, fontSize: '0.875rem' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${c.ghost}`, position: 'sticky', top: 0, background: c.bg, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', maxWidth: 540, margin: '0 auto' }}>
          <div>
            <div style={{ fontSize: '0.5625rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: c.faint, marginBottom: 5 }}>Discover</div>
            <div style={{ fontSize: '1rem', color: c.fg, lineHeight: 1.3 }}>Swipe right to save, left to skip</div>
            <div style={{ fontSize: '0.6875rem', color: c.faint, marginTop: 4 }}>
              Visa probability calibrated to your AMP tier and {country?.name} passport
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '0.625rem', color: meta.color, border: `1px solid ${meta.color}`, padding: '3px 8px', letterSpacing: '0.1em', display: 'inline-block', marginBottom: 4 }}>
              {meta.short}
            </div>
            <div style={{ fontSize: '0.6875rem', color: c.faint }}>
              AMP {score}/1000
            </div>
          </div>
        </div>
      </div>

      <SwipeDeck passport={passport} />
    </div>
  );
}
