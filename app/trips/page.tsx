'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DestCard from '@/components/DestCard';
import { c, MONO, DESTINATIONS } from '@/lib/data';
import { usePassageStore } from '@/lib/store';

export default function TripsPage() {
  const router = useRouter();

  const _hasHydrated       = usePassageStore(s => s._hasHydrated);
  const passport           = usePassageStore(s => s.passport);
  const swipedDestinations = usePassageStore(s => s.swipedDestinations);

  useEffect(() => {
    if (_hasHydrated && !passport) router.replace('/');
  }, [_hasHydrated, passport, router]);

  if (!_hasHydrated || !passport) return null;

  const saved = swipedDestinations
    .filter(s => s.dir === 'right')
    .map(s => DESTINATIONS.find(d => d.id === s.id))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));

  return (
    <div style={{ fontFamily: MONO, minHeight: '100vh', fontSize: '0.875rem', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${c.ghost}`, position: 'sticky', top: 0, background: c.bg, zIndex: 10 }}>
        <div style={{ fontSize: '0.5625rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: c.faint, marginBottom: 5 }}>Your trips</div>
        <div style={{ fontSize: '1rem', color: c.fg }}>Saved destinations</div>
        <div style={{ fontSize: '0.6875rem', color: c.faint, marginTop: 4 }}>
          {saved.length > 0 ? `${saved.length} saved · click any to view itinerary and book` : 'Nothing saved yet'}
        </div>
      </div>

      {saved.length > 0 ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
          style={{ borderLeft: `1px solid ${c.ghost}`, borderTop: `1px solid ${c.ghost}` }}
        >
          {saved.map(dest => (
            <DestCard key={dest.id} dest={dest} passport={passport} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: c.faint, marginBottom: 20, lineHeight: 1.7 }}>
            No saved destinations yet.<br />
            Go to Discover and press + on a destination to save it here.
          </div>
          <button
            onClick={() => router.push('/discover')}
            style={{ background: 'none', border: `1px solid ${c.ghost}`, color: c.dim, fontFamily: MONO, fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 24px', cursor: 'pointer' }}
          >
            Browse destinations →
          </button>
        </div>
      )}
    </div>
  );
}
