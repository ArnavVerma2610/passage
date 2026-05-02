'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DestCard from '@/components/DestCard';
import { DESTINATIONS } from '@/lib/data';
import { usePassageStore } from '@/lib/store';

export default function TripsPage() {
  const router = useRouter();

  const _hasHydrated = usePassageStore(s => s._hasHydrated);
  const passport = usePassageStore(s => s.passport);
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
    <div className="min-h-screen pb-20 text-sm">
      <div className="sticky top-0 z-10 border-b border-ghost bg-bg px-6 pb-5 pt-6">
        <div className="mb-1 text-[0.5625rem] uppercase tracking-[0.18em] text-faint">
          Your trips
        </div>
        <div className="text-base text-fg">Saved destinations</div>
        <div className="mt-1 text-[0.6875rem] text-faint">
          {saved.length > 0
            ? `${saved.length} saved · click any to view itinerary and book`
            : 'Nothing saved yet'}
        </div>
      </div>

      {saved.length > 0 ? (
        <div className="grid grid-cols-1 border-l border-t border-ghost sm:grid-cols-2 xl:grid-cols-3">
          {saved.map(dest => (
            <DestCard key={dest.id} dest={dest} passport={passport} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
          <div className="mb-5 text-sm leading-[1.7] text-faint">
            No saved destinations yet.
            <br />
            Go to Discover and press + on a destination to save it here.
          </div>
          <button
            type="button"
            onClick={() => router.push('/discover')}
            className="cursor-pointer border border-ghost bg-transparent px-6 py-3 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-dim"
          >
            Browse destinations →
          </button>
        </div>
      )}
    </div>
  );
}
