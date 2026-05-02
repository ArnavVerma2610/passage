'use client';

import { useEffect, useRef, useState } from 'react';
import Btn from '@/components/Btn';
import type {
  BookingResult,
  BookingResultFlight,
  BookingResultHotel,
  BookingResultSuborbital,
  BookingResultVisa,
  BookingType,
  Destination,
} from '@/lib/types';

interface BookingModalProps {
  type: BookingType;
  dest: Destination;
  onClose: () => void;
}

interface Step {
  label: string;
  ms: number;
}

function wait(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

function stepsFor(type: BookingType, dest: Destination): Step[] {
  if (type === 'flight')
    return [
      { label: 'Connecting to MakeMyTrip...', ms: 700 },
      { label: `Searching flights to ${dest.travelPlan.flights.to}...`, ms: 800 },
      { label: 'Optimizing for price and timing...', ms: 600 },
      { label: 'Confirming booking...', ms: 0 },
    ];
  if (type === 'suborbital')
    return [
      { label: 'Verifying medical clearance...', ms: 800 },
      {
        label: `Reserving launch slot at ${dest.travelPlan.suborbital.origin}...`,
        ms: 900,
      },
      { label: 'Validating G-tolerance window...', ms: 700 },
      { label: 'Sequencing cabin & re-entry corridor...', ms: 0 },
    ];
  if (type === 'hotel')
    return [
      { label: 'Connecting to MakeMyTrip...', ms: 700 },
      { label: `Searching stays near ${dest.name}...`, ms: 800 },
      { label: 'Checking availability...', ms: 600 },
      { label: 'Confirming reservation...', ms: 0 },
    ];
  return [
    { label: 'Checking visa requirements...', ms: 700 },
    { label: 'Analyzing your travel profile...', ms: 800 },
    { label: 'Preparing application...', ms: 600 },
    { label: 'Submitting application...', ms: 0 },
  ];
}

function modalLabel(type: BookingType): string {
  if (type === 'suborbital') return '◆ orbital ops · spacex lattice';
  return '@makemytrip integration';
}

export default function BookingModal({ type, dest, onClose }: BookingModalProps) {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const steps = stepsFor(type, dest);

  useEffect(() => {
    cancelRef.current = false;

    const apiPromise = fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, destinationId: dest.id }),
    }).then(r => r.json() as Promise<BookingResult>);

    (async () => {
      for (let i = 0; i < steps.length - 1; i++) {
        if (cancelRef.current) return;
        setStep(i);
        await wait(steps[i].ms);
      }
      if (cancelRef.current) return;
      setStep(steps.length - 1);

      try {
        const data = await apiPromise;
        if (!cancelRef.current) setResult(data);
      } catch {
        if (!cancelRef.current) setError('Something went wrong. Try again.');
      }
    })();

    return () => {
      cancelRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = result !== null;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col justify-center bg-bg/95 px-7">
      <div className="mb-4 text-[10px] uppercase tracking-[0.15em] text-faint">
        {modalLabel(type)}
      </div>

      {steps.map((s, i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-2.5 transition-opacity duration-300"
          style={{ opacity: i <= step ? 1 : 0.15 }}
        >
          <div
            className={`h-2 w-2 rounded-full transition-all ${
              i <= step ? 'border border-fg' : 'border border-faint'
            }`}
            style={{
              background:
                i < step ? 'var(--c-fg)' : done && i === step ? 'var(--c-success)' : 'transparent',
            }}
          />
          <span className={`text-[13px] ${i <= step ? 'text-sub' : 'text-faint'}`}>{s.label}</span>
        </div>
      ))}

      {error && <div className="mt-5 text-[13px] text-danger">{error}</div>}

      {done && result && (
        <div className="mt-7 border border-ghost p-4">
          <div className="mb-3 text-[10px] uppercase tracking-[0.1em] text-faint">
            Ref: {result.bookingRef}
          </div>

          {type === 'flight' &&
            (() => {
              const d = result.details as BookingResultFlight;
              return (
                <>
                  <div className="mb-1 text-sm">
                    {d.from} → {d.to}
                  </div>
                  <div className="text-[13px] text-dim">
                    {d.airline} · {d.class}
                  </div>
                  <div className="mt-1 text-xs text-faint">
                    {d.duration} · {d.price} · Seat {d.seat}
                  </div>
                </>
              );
            })()}

          {type === 'suborbital' &&
            (() => {
              const d = result.details as BookingResultSuborbital;
              return (
                <>
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span>
                      {d.origin} → {d.arrival}
                    </span>
                    <span className="font-mono text-xs text-faint">{d.flightNumber}</span>
                  </div>
                  <div className="text-[13px] text-dim">
                    {d.vehicle} · {d.operator}
                  </div>
                  <div className="mt-1 text-xs text-faint">
                    {d.duration} · peak {d.peakG} · {d.price}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] tracking-[0.06em] text-faint">
                    <span className="border border-ghost px-1.5 py-[3px]">{d.cabin}</span>
                    <span className="border border-ghost px-1.5 py-[3px]">Berth {d.berth}</span>
                    <span className="border border-ghost px-1.5 py-[3px]">
                      Launch {d.launchWindow}
                    </span>
                    <span className="border border-ghost px-1.5 py-[3px]">
                      Re-entry: {d.reentryCorridor}
                    </span>
                  </div>
                </>
              );
            })()}

          {type === 'hotel' &&
            (() => {
              const d = result.details as BookingResultHotel;
              return (
                <>
                  <div className="mb-1 text-sm">{d.name}</div>
                  <div className="text-[13px] text-dim">
                    {d.hotelType} · {d.nights} nights
                  </div>
                  <div className="mt-1 text-xs text-faint">
                    {d.pricePerNight} · Code: {d.confirmationCode}
                  </div>
                </>
              );
            })()}

          {type === 'visa' &&
            (() => {
              const d = result.details as BookingResultVisa;
              return (
                <>
                  <div className="mb-1 text-sm">
                    {d.applicationType} for {d.country}
                  </div>
                  <div className="text-[13px] text-dim">Status: {d.status}</div>
                  <div className="mt-1 text-xs text-faint">
                    Processing: {d.processingTime} · ID: {d.applicationId}
                  </div>
                </>
              );
            })()}
        </div>
      )}

      <div className="mt-6 flex gap-2.5">
        {done && <Btn onClick={onClose}>Confirm booking</Btn>}
        <Btn variant="outline" onClick={onClose} style={{ marginTop: 0 }}>
          {done ? 'Cancel' : 'Close'}
        </Btn>
      </div>
    </div>
  );
}
