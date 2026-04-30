'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TopBar from '@/components/TopBar';
import BookingModal from '@/components/BookingModal';
import FoodMenuModal, { priceDollars } from '@/components/FoodMenuModal';
import ItineraryEditor from '@/components/ItineraryEditor';
import { c, MONO, DESTINATIONS } from '@/lib/data';
import { usePassageStore } from '@/lib/store';
import type { BookingType, FoodSpot } from '@/lib/types';

export default function TripPage() {
  const router = useRouter();
  const params = useParams();

  const _hasHydrated           = usePassageStore(s => s._hasHydrated);
  const passport               = usePassageStore(s => s.passport);
  const setSelectedDestination = usePassageStore(s => s.setSelectedDestination);

  const [tab, setTab]                   = useState<'plan' | 'food' | 'book'>('plan');
  const [bookingModal, setBookingModal] = useState<BookingType | null>(null);
  const [foodSpot, setFoodSpot]         = useState<FoodSpot | null>(null);

  const dest = DESTINATIONS.find(d => d.id === params.id);

  useEffect(() => {
    if (_hasHydrated && !passport) { router.replace('/'); return; }
    if (dest) setSelectedDestination(dest);
    return () => { setSelectedDestination(null); };
  }, [_hasHydrated, passport, dest, setSelectedDestination, router]);

  if (!_hasHydrated || !passport || !dest) return null;

  const prob = dest.visaProb[passport] || 50;
  const probColor = prob > 80 ? c.sub : '#cc9900';

  const cardStyle: React.CSSProperties = {
    border: `1px solid ${c.ghost}`,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  };

  return (
    <div style={{ fontFamily: MONO, minHeight: '100vh', fontSize: '0.875rem', lineHeight: 1.55 }}>
      <TopBar title={dest.name} right={dest.country} onBack={() => router.push('/discover')} />

      <div style={{ maxWidth: 920, margin: '0 auto', paddingBottom: 80 }}>
        {/* Hero */}
        <div style={{ padding: '28px 24px 0' }}>
          <div style={{ fontSize: '0.5625rem', color: c.faint, letterSpacing: '0.14em', marginBottom: 10 }}>
            {dest.coords} · {dest.region}
          </div>
          <div style={{ fontSize: '1.875rem', marginBottom: 6, lineHeight: 1.1 }}>{dest.name}</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            <span style={{ padding: '5px 10px', fontSize: '0.625rem', border: `1px solid ${c.ghost}`, color: c.faint }}>{dest.bestMonths}</span>
            <span style={{ padding: '5px 10px', fontSize: '0.625rem', border: `1px solid ${c.ghost}`, color: c.faint }}>{dest.avgTemp}</span>
            <span style={{ padding: '5px 10px', fontSize: '0.625rem', border: `1px solid ${c.ghost}`, color: c.faint }}>{dest.currency}</span>
            <span style={{ padding: '5px 10px', fontSize: '0.625rem', border: `1px solid ${prob > 80 ? c.ghost : '#440000'}`, color: prob > 80 ? c.sub : '#cc4444' }}>
              {prob}% VISA
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${c.ghost}`, padding: '0 24px' }}>
          {(['plan', 'food', 'book'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: 'none', border: 'none',
                borderBottom: tab === t ? `1px solid ${c.fg}` : '1px solid transparent',
                color: tab === t ? c.fg : c.faint, fontFamily: MONO,
                fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '14px 16px', cursor: 'pointer', marginBottom: -1,
              }}
            >
              {t === 'plan' ? 'Itinerary' : t === 'food' ? 'Food spots' : 'Book'}
            </button>
          ))}
        </div>

        {/* Plan tab — interactive editor */}
        {tab === 'plan' && (
          <div style={{ padding: '24px' }}>
            <ItineraryEditor dest={dest} />
          </div>
        )}

        {/* Food tab — clickable cards open menu modal */}
        {tab === 'food' && (
          <div style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.6875rem', color: c.faint, marginBottom: 18, lineHeight: 1.6 }}>
              {dest.foodSpots.length} spots submitted by travelers. Click any to see the menu.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 14 }}>
              {dest.foodSpots.map(spot => (
                <button
                  key={spot.id}
                  onClick={() => setFoodSpot(spot)}
                  style={{
                    textAlign: 'left',
                    padding: '18px',
                    background: c.surface,
                    border: `1px solid ${c.ghost}`,
                    cursor: 'pointer',
                    fontFamily: MONO,
                    color: c.fg,
                    transition: 'border-color 0.15s, background 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = c.fg; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = c.ghost; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: '0.9375rem', color: c.fg, lineHeight: 1.3 }}>{spot.name}</span>
                    <span style={{ fontSize: '0.6875rem', color: c.dim, border: `1px solid ${c.ghost}`, padding: '2px 8px', flexShrink: 0, letterSpacing: '0.05em' }}>
                      {priceDollars(spot.priceLevel)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: c.dim, lineHeight: 1.55, marginBottom: 12, flex: 1 }}>
                    {spot.desc}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: c.faint, marginBottom: 4, fontStyle: 'italic' }}>
                    {spot.type}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: c.faint }}>
                    submitted by <span style={{ color: c.dim }}>{spot.submittedBy}</span>
                  </div>
                  <div style={{ marginTop: 12, fontSize: '0.5625rem', color: c.fg, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    View menu →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Book tab — aligned grid */}
        {tab === 'book' && (
          <div style={{ padding: '24px' }}>
            {/* Section: Flights + Visa side-by-side */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: '0.5625rem', letterSpacing: '0.16em', color: c.faint, marginBottom: 12, textTransform: 'uppercase' }}>
                Flights & visa
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 14 }}>
                {/* Flight card */}
                <div style={cardStyle}>
                  <div style={{ fontSize: '0.5625rem', letterSpacing: '0.14em', color: c.faint, marginBottom: 12, textTransform: 'uppercase' }}>
                    Flight
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: '1rem' }}>{dest.travelPlan.flights.from} → {dest.travelPlan.flights.to}</span>
                    <span style={{ fontSize: '1rem', whiteSpace: 'nowrap' }}>{dest.travelPlan.flights.price}</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: c.dim, marginBottom: 4 }}>{dest.travelPlan.flights.airline}</div>
                  <div style={{ fontSize: '0.75rem', color: c.faint, flex: 1 }}>{dest.travelPlan.flights.duration} · {dest.travelPlan.flights.stops} stop</div>
                  <button
                    onClick={() => setBookingModal('flight')}
                    style={{ marginTop: 16, width: '100%', padding: '13px', background: 'none', border: `1px solid ${c.fg}`, color: c.fg, fontFamily: MONO, fontSize: '0.6875rem', letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase' }}
                  >
                    @MakeMyTrip — Book flight
                  </button>
                </div>

                {/* Visa card */}
                <div style={cardStyle}>
                  <div style={{ fontSize: '0.5625rem', letterSpacing: '0.14em', color: c.faint, marginBottom: 12, textTransform: 'uppercase' }}>
                    Visa
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: '1rem' }}>e-Visa Application</span>
                    <span style={{ fontSize: '0.75rem', color: probColor, whiteSpace: 'nowrap' }}>{prob}% probability</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: c.dim, lineHeight: 1.6, flex: 1 }}>
                    Based on your passport and profile. Processing time: 5–14 days.
                  </div>
                  <button
                    onClick={() => setBookingModal('visa')}
                    style={{ marginTop: 16, width: '100%', padding: '13px', background: c.fg, border: 'none', color: c.bg, fontFamily: MONO, fontSize: '0.6875rem', letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase' }}
                  >
                    Start visa application
                  </button>
                </div>
              </div>
            </div>

            {/* Section: Hotels */}
            <div>
              <div style={{ fontSize: '0.5625rem', letterSpacing: '0.16em', color: c.faint, marginBottom: 12, textTransform: 'uppercase' }}>
                Stays
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
                {dest.travelPlan.hotels.map((h, i) => (
                  <div key={i} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: '1rem' }}>{h.name}</span>
                      <span style={{ fontSize: '0.75rem', color: c.sub, whiteSpace: 'nowrap' }}>{h.price}</span>
                    </div>
                    <div style={{ fontSize: '0.625rem', color: c.faint, marginBottom: 10, border: `1px solid ${c.ghost}`, alignSelf: 'flex-start', padding: '3px 8px' }}>{h.type}</div>
                    <div style={{ fontSize: '0.8125rem', color: c.dim, lineHeight: 1.6, flex: 1 }}>{h.desc}</div>
                    <button
                      onClick={() => setBookingModal('hotel')}
                      style={{ marginTop: 16, width: '100%', padding: '12px', background: 'none', border: `1px solid ${c.faint}`, color: c.dim, fontFamily: MONO, fontSize: '0.6875rem', letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase' }}
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

      {bookingModal && dest && (
        <BookingModal type={bookingModal} dest={dest} onClose={() => setBookingModal(null)} />
      )}
      {foodSpot && (
        <FoodMenuModal spot={foodSpot} onClose={() => setFoodSpot(null)} />
      )}
    </div>
  );
}
