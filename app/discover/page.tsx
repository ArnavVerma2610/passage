'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DestCard from '@/components/DestCard';
import { c, MONO, DESTINATIONS, COUNTRIES_ACCESS } from '@/lib/data';
import { usePassageStore } from '@/lib/store';

export default function DiscoverPage() {
  const router = useRouter();

  const _hasHydrated       = usePassageStore(s => s._hasHydrated);
  const passport           = usePassageStore(s => s.passport);
  const swipedDestinations = usePassageStore(s => s.swipedDestinations);

  useEffect(() => {
    if (_hasHydrated && !passport) router.replace('/');
  }, [_hasHydrated, passport, router]);

  if (!_hasHydrated || !passport) return null;

  const country = COUNTRIES_ACCESS[passport];
  const saved   = swipedDestinations.filter(s => s.dir === 'right').length;

  return (
    <div style={{ fontFamily: MONO, minHeight: '100vh', paddingBottom: 80, fontSize: '0.875rem' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${c.ghost}`, position: 'sticky', top: 0, background: c.bg, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.5625rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: c.faint, marginBottom: 5 }}>Discover</div>
            <div style={{ fontSize: '1rem', color: c.fg, lineHeight: 1.3 }}>Destinations calibrated to your passport</div>
            <div style={{ fontSize: '0.6875rem', color: c.faint, marginTop: 4 }}>
              Visa probabilities based on {country?.name} passport
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '0.75rem', color: c.sub }}>{country?.code} · {country?.score}/100</div>
            <div style={{ fontSize: '0.6875rem', color: c.faint, marginTop: 2 }}>
              {saved > 0 ? `${saved} saved` : `${DESTINATIONS.length} destinations`}
            </div>
          </div>
        </div>
      </div>

      {/* Destination grid — 1 col mobile, 2 col sm, 3 col xl */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
        style={{ borderLeft: `1px solid ${c.ghost}`, borderTop: `1px solid ${c.ghost}` }}
      >
        {DESTINATIONS.map(dest => (
          <DestCard key={dest.id} dest={dest} passport={passport} />
        ))}
      </div>
    </div>
  );
}
