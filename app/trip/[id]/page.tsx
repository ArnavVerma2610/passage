'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import BookingModal from '@/components/BookingModal';
import FoodMenuModal, { priceDollars } from '@/components/FoodMenuModal';
import ItineraryEditor from '@/components/ItineraryEditor';
import MeshBeaconCard from '@/components/MeshBeaconCard';
import GeoFeedCard from '@/components/GeoFeedCard';
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

  const [tab, setTab] = useState<'plan' | 'food' | 'safety' | 'book'>('plan');
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

        <div className="flex overflow-x-auto border-b border-ghost px-6">
          {(['plan', 'food', 'safety', 'book'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px shrink-0 cursor-pointer border-b border-t-0 border-l-0 border-r-0 bg-transparent px-4 py-3.5 font-mono text-xs uppercase tracking-[0.1em] ${
                tab === t ? 'border-fg text-fg' : 'border-transparent text-faint'
              }`}
            >
              {t === 'plan'
                ? 'Itinerary'
                : t === 'food'
                  ? 'Food spots'
                  : t === 'safety'
                    ? 'Safety'
                    : 'Book'}
            </button>
          ))}
        </div>

        {tab === 'plan' && (
          <div className="p-6">
            <ItineraryEditor dest={dest} />
          </div>
        )}

        {tab === 'safety' && (
          <div className="flex flex-col gap-3.5 p-6">
            <MeshBeaconCard dest={dest} />
            <GeoFeedCard dest={dest} />
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
                Transit
              </div>
              <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
                <div className={CARD}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                      Flight · standard
                    </div>
                    <div className="border border-ghost px-1.5 py-px text-[0.5rem] uppercase tracking-[0.14em] text-faint">
                      ATM · 9-12h
                    </div>
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

                <div
                  className={`${CARD} relative overflow-hidden`}
                  style={{
                    background: 'linear-gradient(135deg, var(--c-surface) 0%, var(--c-bg) 100%)',
                  }}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, var(--c-fg) 50%, transparent)',
                    }}
                  />
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-fg">
                      ◆ Suborbital · point-to-point
                    </div>
                    <div className="border border-fg px-1.5 py-px text-[0.5rem] uppercase tracking-[0.14em] text-fg">
                      Tier 3
                    </div>
                  </div>
                  <div className="mb-1.5 flex items-start justify-between gap-2.5">
                    <span className="text-base">
                      {dest.travelPlan.suborbital.originCode} →{' '}
                      {dest.travelPlan.suborbital.arrivalCode}
                    </span>
                    <span className="whitespace-nowrap text-base">
                      {dest.travelPlan.suborbital.price}
                    </span>
                  </div>
                  <div className="mb-1 text-[0.8125rem] text-dim">
                    {dest.travelPlan.suborbital.vehicle} · {dest.travelPlan.suborbital.operator}
                  </div>
                  <div className="mb-3 text-[0.6875rem] text-faint">
                    {dest.travelPlan.suborbital.duration} suborbital ·{' '}
                    {dest.travelPlan.suborbital.peakG} peak ·{' '}
                    {dest.travelPlan.suborbital.windowsPerDay} windows/day
                  </div>
                  <div className="mb-3 flex flex-wrap gap-1.5 text-[0.5625rem] tracking-[0.06em] text-faint">
                    <span className="border border-ghost px-1.5 py-[3px]">
                      {dest.travelPlan.suborbital.medicalGate}
                    </span>
                    <span className="border border-ghost px-1.5 py-[3px]">
                      {dest.travelPlan.suborbital.fastingWindow}
                    </span>
                    <span className="border border-success-border px-1.5 py-[3px] text-success">
                      {dest.travelPlan.suborbital.carbonOffset}
                    </span>
                  </div>
                  <div className="flex-1 text-[0.6875rem] italic leading-snug text-faint">
                    {dest.travelPlan.suborbital.onward}
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookingModal('suborbital')}
                    className="mt-4 w-full cursor-pointer border-0 bg-fg p-[13px] font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-bg"
                  >
                    Reserve orbital seat →
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-7">
              <div className="mb-3 text-[0.5625rem] uppercase tracking-[0.16em] text-faint">
                Border crossing
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
