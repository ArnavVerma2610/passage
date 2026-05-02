'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import BookingModal from '@/components/BookingModal';
import FoodMenuModal, { priceDollars } from '@/components/FoodMenuModal';
import ItineraryEditor from '@/components/ItineraryEditor';
import { DESTINATIONS } from '@/lib/data';
import { usePassageStore } from '@/lib/store';
import { computeAmpScore, effectiveVisaProb, getTier, TIER_META } from '@/lib/amp';
import type { BookingType, FoodSpot } from '@/lib/types';

interface TripPageProps {
  params: Promise<{ id: string }>;
}

const CARD = 'flex h-full flex-col border border-ghost p-5';

export default function TripPage({ params }: TripPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const _hasHydrated = usePassageStore(s => s._hasHydrated);
  const passport = usePassageStore(s => s.passport);
  const amp = usePassageStore(s => s.amp);
  const setSelectedDestination = usePassageStore(s => s.setSelectedDestination);

  const [tab, setTab] = useState<'plan' | 'food' | 'book'>('plan');
  const [bookingModal, setBookingModal] = useState<BookingType | null>(null);
  const [foodSpot, setFoodSpot] = useState<FoodSpot | null>(null);

  const dest = DESTINATIONS.find(d => d.id === id);

  useEffect(() => {
    if (_hasHydrated && !passport) {
      router.replace('/');
      return;
    }
    if (dest) setSelectedDestination(dest);
    return () => setSelectedDestination(null);
  }, [_hasHydrated, passport, dest, setSelectedDestination, router]);

  if (!_hasHydrated || !passport || !dest) return null;

  const baseProb = dest.visaProb[passport] || 50;
  const tier = getTier(computeAmpScore(amp));
  const tierMeta = TIER_META[tier];
  const prob = effectiveVisaProb(baseProb, tier);
  const probHigh = prob > 80;

  return (
    <div className="min-h-screen text-sm leading-[1.55]">
      <TopBar title={dest.name} right={dest.country} onBack={() => router.push('/discover')} />

      <div className="mx-auto max-w-[920px] pb-20">
        <div className="px-6 pt-7">
          <div className="mb-2.5 text-[0.5625rem] tracking-[0.14em] text-faint">
            {dest.coords} · {dest.region}
          </div>
          <div className="mb-1.5 text-3xl leading-tight">{dest.name}</div>
          <div className="mb-6 flex flex-wrap gap-2">
            <span className="border border-ghost px-2.5 py-[5px] text-[0.625rem] text-faint">
              {dest.bestMonths}
            </span>
            <span className="border border-ghost px-2.5 py-[5px] text-[0.625rem] text-faint">
              {dest.avgTemp}
            </span>
            <span className="border border-ghost px-2.5 py-[5px] text-[0.625rem] text-faint">
              {dest.currency}
            </span>
            <span
              className={`border px-2.5 py-[5px] text-[0.625rem] ${
                probHigh ? 'border-ghost text-sub' : 'border-danger-border text-danger'
              }`}
            >
              {prob}% VISA
            </span>
            <span
              className="border px-2.5 py-[5px] text-[0.625rem]"
              style={{ borderColor: tierMeta.color, color: tierMeta.color }}
            >
              {tierMeta.short}
            </span>
          </div>
        </div>

        <div className="flex border-b border-ghost px-6">
          {(['plan', 'food', 'book'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px cursor-pointer border-b border-t-0 border-l-0 border-r-0 bg-transparent px-4 py-3.5 font-mono text-xs uppercase tracking-[0.1em] ${
                tab === t ? 'border-fg text-fg' : 'border-transparent text-faint'
              }`}
            >
              {t === 'plan' ? 'Itinerary' : t === 'food' ? 'Food spots' : 'Book'}
            </button>
          ))}
        </div>

        {tab === 'plan' && (
          <div className="p-6">
            <ItineraryEditor dest={dest} />
          </div>
        )}

        {tab === 'food' && (
          <div className="p-6">
            <div className="mb-[18px] text-[0.6875rem] leading-relaxed text-faint">
              {dest.foodSpots.length} spots submitted by travelers. Click any to see the menu.
            </div>
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
              {dest.foodSpots.map(spot => (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => setFoodSpot(spot)}
                  className="flex cursor-pointer flex-col border border-ghost bg-surface p-[18px] text-left font-mono text-fg transition-colors hover:border-fg"
                >
                  <div className="mb-2 flex items-start justify-between gap-2.5">
                    <span className="text-[0.9375rem] leading-snug text-fg">{spot.name}</span>
                    <span className="shrink-0 border border-ghost px-2 py-0.5 text-[0.6875rem] tracking-[0.05em] text-dim">
                      {priceDollars(spot.priceLevel)}
                    </span>
                  </div>
                  <div className="mb-3 flex-1 text-[0.8125rem] leading-relaxed text-dim">
                    {spot.desc}
                  </div>
                  <div className="mb-1 text-[0.625rem] italic text-faint">{spot.type}</div>
                  <div className="text-[0.625rem] text-faint">
                    submitted by <span className="text-dim">{spot.submittedBy}</span>
                  </div>
                  <div className="mt-3 text-[0.5625rem] uppercase tracking-[0.14em] text-fg">
                    View menu →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'book' && (
          <div className="p-6">
            <div className="mb-7">
              <div className="mb-3 text-[0.5625rem] uppercase tracking-[0.16em] text-faint">
                Flights & visa
              </div>
              <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
                <div className={CARD}>
                  <div className="mb-3 text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                    Flight
                  </div>
                  <div className="mb-1.5 flex items-start justify-between gap-2.5">
                    <span className="text-base">
                      {dest.travelPlan.flights.from} → {dest.travelPlan.flights.to}
                    </span>
                    <span className="whitespace-nowrap text-base">
                      {dest.travelPlan.flights.price}
                    </span>
                  </div>
                  <div className="mb-1 text-[0.8125rem] text-dim">
                    {dest.travelPlan.flights.airline}
                  </div>
                  <div className="flex-1 text-xs text-faint">
                    {dest.travelPlan.flights.duration} · {dest.travelPlan.flights.stops} stop
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookingModal('flight')}
                    className="mt-4 w-full cursor-pointer border border-fg bg-transparent p-[13px] font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-fg"
                  >
                    @MakeMyTrip — Book flight
                  </button>
                </div>

                <div className={CARD}>
                  <div className="mb-3 text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                    Visa
                  </div>
                  <div className="mb-1.5 flex items-start justify-between gap-2.5">
                    <span className="text-base">e-Visa Application</span>
                    <span
                      className={`whitespace-nowrap text-xs ${probHigh ? 'text-sub' : 'text-warn'}`}
                    >
                      {prob}% probability
                    </span>
                  </div>
                  <div className="flex-1 text-[0.8125rem] leading-relaxed text-dim">
                    Based on your passport and profile. Processing time: 5–14 days.
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookingModal('visa')}
                    className="mt-4 w-full cursor-pointer border-0 bg-fg p-[13px] font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-bg"
                  >
                    Start visa application
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 text-[0.5625rem] uppercase tracking-[0.16em] text-faint">
                Stays
              </div>
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                {dest.travelPlan.hotels.map((h, i) => (
                  <div key={i} className={CARD}>
                    <div className="mb-2 flex items-start justify-between gap-2.5">
                      <span className="text-base">{h.name}</span>
                      <span className="whitespace-nowrap text-xs text-sub">{h.price}</span>
                    </div>
                    <div className="mb-2.5 self-start border border-ghost px-2 py-[3px] text-[0.625rem] text-faint">
                      {h.type}
                    </div>
                    <div className="flex-1 text-[0.8125rem] leading-relaxed text-dim">{h.desc}</div>
                    <button
                      type="button"
                      onClick={() => setBookingModal('hotel')}
                      className="mt-4 w-full cursor-pointer border border-faint bg-transparent p-3 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-dim"
                    >
                      @MakeMyTrip — Book stay
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {bookingModal && (
        <BookingModal type={bookingModal} dest={dest} onClose={() => setBookingModal(null)} />
      )}
      {foodSpot && <FoodMenuModal spot={foodSpot} onClose={() => setFoodSpot(null)} />}
    </div>
  );
}
