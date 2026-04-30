'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TopBar from '@/components/TopBar';
import BookingModal from '@/components/BookingModal';
import { c, MONO, DESTINATIONS } from '@/lib/data';
import { usePassageStore } from '@/lib/store';
import type { BookingType } from '@/lib/types';

export default function TripPage() {
  const router = useRouter();
  const params = useParams();

  const _hasHydrated        = usePassageStore(s => s._hasHydrated);
  const passport            = usePassageStore(s => s.passport);
  const setSelectedDestination = usePassageStore(s => s.setSelectedDestination);

  const [tab, setTab]           = useState<'plan' | 'food' | 'book'>('plan');
  const [bookingModal, setBookingModal] = useState<BookingType | null>(null);

  const dest = DESTINATIONS.find(d => d.id === params.id);

  useEffect(() => {
    if (_hasHydrated && !passport) { router.replace('/'); return; }
    if (dest) setSelectedDestination(dest);
    return () => { setSelectedDestination(null); };
  }, [_hasHydrated, passport, dest, setSelectedDestination, router]);

  if (!_hasHydrated || !passport || !dest) return null;

  const prob = dest.visaProb[passport] || 50;
  const probColor = prob > 80 ? c.sub : '#cc9900';

  return (
    <div style={{ fontFamily: MONO, minHeight: '100vh', fontSize: '0.875rem', lineHeight: 1.55 }}>
      <TopBar title={dest.name} right={dest.country} onBack={() => router.push('/discover')} />

      <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 80 }}>
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

        {/* Plan tab */}
        {tab === 'plan' && (
          <div style={{ padding: '24px 24px' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {dest.travelPlan.itinerary.map((day, i) => (
                <div key={i} style={{ marginBottom: 24, paddingLeft: 20, borderLeft: `1px solid ${i === 3 ? c.fg : c.ghost}`, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -4, top: 0, width: 7, height: 7, borderRadius: '50%', background: i === 3 ? c.fg : c.ghost }} />
                  <div style={{ fontSize: '0.5625rem', color: c.faint, letterSpacing: '0.1em', marginBottom: 5 }}>DAY {day.day}</div>
                  <div style={{ fontSize: '0.9375rem', marginBottom: 6 }}>{day.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: c.dim, lineHeight: 1.6 }}>{day.desc}</div>
                  {i === 3 && <div style={{ fontSize: '0.625rem', color: c.faint, marginTop: 8, fontStyle: 'italic' }}>↑ The app goes dark today</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Food tab */}
        {tab === 'food' && (
          <div style={{ padding: '24px 24px' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dest.foodSpots.map((spot, i) => (
                <div key={i} style={{ padding: '18px', background: c.surface, borderLeft: `2px solid ${c.ghost}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.9375rem', color: c.fg }}>{spot.name}</span>
                    <span style={{ fontSize: '0.625rem', color: c.faint, border: `1px solid ${c.ghost}`, padding: '2px 8px', alignSelf: 'flex-start' }}>{spot.price}</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: c.dim, lineHeight: 1.6, marginBottom: 10 }}>{spot.desc}</div>
                  <div style={{ fontSize: '0.6875rem', color: c.faint, fontStyle: 'italic' }}>📍 {spot.map}</div>
                  <div style={{ fontSize: '0.625rem', color: c.faint, marginTop: 6, letterSpacing: '0.05em' }}>{spot.type}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Book tab */}
        {tab === 'book' && (
          <div style={{ padding: '24px 24px' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Flights */}
              <div>
                <div style={{ fontSize: '0.625rem', letterSpacing: '0.14em', color: c.faint, marginBottom: 14, textTransform: 'uppercase' }}>Flights</div>
                <div style={{ border: `1px solid ${c.ghost}`, padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '1rem' }}>{dest.travelPlan.flights.from} → {dest.travelPlan.flights.to}</span>
                    <span style={{ fontSize: '1rem' }}>{dest.travelPlan.flights.price}</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: c.dim, marginBottom: 4 }}>{dest.travelPlan.flights.airline}</div>
                  <div style={{ fontSize: '0.75rem', color: c.faint }}>{dest.travelPlan.flights.duration} · {dest.travelPlan.flights.stops} stop</div>
                  <button
                    onClick={() => setBookingModal('flight')}
                    style={{ marginTop: 16, width: '100%', padding: '13px', background: 'none', border: `1px solid ${c.fg}`, color: c.fg, fontFamily: MONO, fontSize: '0.6875rem', letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase' }}
                  >
                    @MakeMyTrip — Book this flight
                  </button>
                </div>
              </div>

              {/* Visa */}
              <div>
                <div style={{ fontSize: '0.625rem', letterSpacing: '0.14em', color: c.faint, marginBottom: 14, textTransform: 'uppercase' }}>Visa</div>
                <div style={{ border: `1px solid ${c.ghost}`, padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '1rem' }}>e-Visa Application</span>
                    <span style={{ fontSize: '0.75rem', color: probColor }}>{prob}% probability</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: c.dim, lineHeight: 1.6, marginBottom: 14 }}>
                    Based on your passport and profile. Processing time: 5–14 days.
                  </div>
                  <button
                    onClick={() => setBookingModal('visa')}
                    style={{ width: '100%', padding: '13px', background: c.fg, border: 'none', color: c.bg, fontFamily: MONO, fontSize: '0.6875rem', letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase' }}
                  >
                    Start visa application
                  </button>
                </div>
              </div>
            </div>

            {/* Hotels */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: '0.625rem', letterSpacing: '0.14em', color: c.faint, marginBottom: 14, textTransform: 'uppercase' }}>Stays</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dest.travelPlan.hotels.map((h, i) => (
                  <div key={i} style={{ border: `1px solid ${c.ghost}`, padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '1rem' }}>{h.name}</span>
                      <span style={{ fontSize: '0.75rem', color: c.sub }}>{h.price}</span>
                    </div>
                    <div style={{ fontSize: '0.625rem', color: c.faint, marginBottom: 8, border: `1px solid ${c.ghost}`, display: 'inline-block', padding: '3px 8px' }}>{h.type}</div>
                    <div style={{ fontSize: '0.8125rem', color: c.dim, lineHeight: 1.6 }}>{h.desc}</div>
                    <button
                      onClick={() => setBookingModal('hotel')}
                      style={{ marginTop: 14, width: '100%', padding: '11px', background: 'none', border: `1px solid ${c.faint}`, color: c.dim, fontFamily: MONO, fontSize: '0.6875rem', letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase' }}
                    >
                      @MakeMyTrip — Book this stay
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
    </div>
  );
}
