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

function headerTitle(type: BookingType, dest: Destination): string {
  if (type === 'suborbital') return 'Launch sequence';
  if (type === 'flight') return `Flight to ${dest.travelPlan.flights.to}`;
  if (type === 'hotel') return `Stay in ${dest.name}`;
  return `Visa for ${dest.country}`;
}

function headerSubtitle(type: BookingType, dest: Destination): string {
  if (type === 'suborbital') {
    const so = dest.travelPlan.suborbital;
    return `${so.originCode} → ${so.arrivalCode} · ${so.vehicle}`;
  }
  if (type === 'flight') {
    const f = dest.travelPlan.flights;
    return `${f.from} → ${f.to} · ${f.airline}`;
  }
  if (type === 'hotel') return dest.travelPlan.hotels[0]?.name ?? dest.name;
  return `${dest.country} · e-Visa`;
}

// Suborbital launch sequence runs through these telemetry rows in order
// as steps complete. Pure ASCII so it survives all themes & fonts.
const TELEMETRY_ROWS = [
  { label: 'PROPELLANT', value: 'METHALOX · 98.4%' },
  { label: 'ATTITUDE', value: 'PITCH 87° · ROLL 0°' },
  { label: 'CABIN PRESS', value: '1.013 BAR · NOMINAL' },
  { label: 'G-TOLERANCE', value: 'CLEARED · 3.4G PEAK' },
];

const TRAJECTORY_ASCII = '·     ━━━━━━━━━━╱─────╲━━━━━━━━     ▲';

export default function BookingModal({ type, dest, onClose }: BookingModalProps) {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const steps = stepsFor(type, dest);

  // Lock body scroll + escape-to-close + click-scrim-to-close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

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
  const isSuborbital = type === 'suborbital';

  // T-minus countdown (suborbital only) — derives a relative second count
  // from progress through the steps so it ticks in sync with the visible work.
  const tMinusSeconds = Math.max(0, (steps.length - 1 - step) * 3);
  const tMinusLabel = done
    ? 'T+00 LAUNCH'
    : `T−${String(Math.floor(tMinusSeconds / 60)).padStart(2, '0')}:${String(
        tMinusSeconds % 60,
      ).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-bg font-mono text-fg">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-ghost bg-bg px-6 py-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <div className="min-w-0">
          <div className="mb-1 truncate text-[0.5625rem] uppercase tracking-[0.16em] text-faint">
            {modalLabel(type)}
          </div>
          <div className="truncate text-base text-fg">{headerTitle(type, dest)}</div>
          <div className="truncate text-[0.6875rem] text-dim">{headerSubtitle(type, dest)}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border border-ghost bg-transparent text-fg"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M2 2 L12 12 M12 2 L2 12"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div
        className="flex-1 overflow-y-auto px-6 py-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6rem)' }}
      >
        <div className="mx-auto max-w-[640px]">
          {/* Suborbital launch theatre */}
          {isSuborbital && (
            <div className="mb-7">
              <div
                className="relative overflow-hidden border border-ghost p-5"
                style={{
                  background: 'linear-gradient(135deg, var(--c-surface) 0%, var(--c-bg) 100%)',
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px"
                  style={{
                    background: 'linear-gradient(90deg, transparent, var(--c-fg) 50%, transparent)',
                  }}
                />
                <div className="mb-4 flex items-baseline justify-between">
                  <span className="text-[0.5625rem] uppercase tracking-[0.16em] text-faint">
                    Mission clock
                  </span>
                  <span className="border border-fg px-1.5 py-px text-[0.5rem] uppercase tracking-[0.14em] text-fg">
                    Tier 3
                  </span>
                </div>
                <div className="mb-4 text-center font-mono text-3xl tracking-[0.1em] text-fg">
                  {tMinusLabel}
                </div>
                <div
                  aria-hidden
                  className="mb-4 overflow-hidden text-center text-[0.625rem] tracking-[0.1em] text-dim"
                >
                  {TRAJECTORY_ASCII}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-ghost pt-3">
                  {TELEMETRY_ROWS.map((row, i) => (
                    <div
                      key={row.label}
                      className="flex flex-col gap-0.5 transition-opacity duration-300"
                      style={{ opacity: i <= step ? 1 : 0.2 }}
                    >
                      <span className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                        {row.label}
                      </span>
                      <span className="text-[0.6875rem] text-sub">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step list */}
          <div className="mb-6">
            <div className="mb-3 text-[0.5625rem] uppercase tracking-[0.16em] text-faint">
              {isSuborbital ? 'Sequence' : 'Progress'}
            </div>
            {steps.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2.5 transition-opacity duration-300"
                style={{ opacity: i <= step ? 1 : 0.2 }}
              >
                <div
                  className={`h-2 w-2 rounded-full transition-all ${
                    i <= step ? 'border border-fg' : 'border border-faint'
                  }`}
                  style={{
                    background:
                      i < step
                        ? 'var(--c-fg)'
                        : done && i === step
                          ? 'var(--c-success)'
                          : 'transparent',
                  }}
                />
                <span className={`text-[0.8125rem] ${i <= step ? 'text-sub' : 'text-faint'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-6 border border-danger-border p-3 text-[0.8125rem] text-danger">
              {error}
            </div>
          )}

          {/* Boarding-pass result card */}
          {done && result && (
            <div
              className="border border-ghost p-5"
              style={{
                background: isSuborbital
                  ? 'linear-gradient(135deg, var(--c-surface) 0%, var(--c-bg) 100%)'
                  : 'var(--c-surface)',
              }}
            >
              <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-dashed border-ghost pb-3">
                <div className="text-[0.5625rem] uppercase tracking-[0.16em] text-faint">
                  Boarding ref
                </div>
                <div className="font-mono text-sm tracking-[0.1em] text-fg">
                  {result.bookingRef}
                </div>
              </div>

              {type === 'flight' &&
                (() => {
                  const d = result.details as BookingResultFlight;
                  return (
                    <>
                      <div className="mb-1 text-base text-fg">
                        {d.from} → {d.to}
                      </div>
                      <div className="mb-3 text-[0.8125rem] text-dim">
                        {d.airline} · {d.class}
                      </div>
                      <div className="grid grid-cols-3 gap-2 border-t border-ghost pt-3">
                        <div>
                          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                            Duration
                          </div>
                          <div className="text-[0.8125rem] text-sub">{d.duration}</div>
                        </div>
                        <div>
                          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                            Seat
                          </div>
                          <div className="text-[0.8125rem] text-sub">{d.seat}</div>
                        </div>
                        <div>
                          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                            Price
                          </div>
                          <div className="text-[0.8125rem] text-sub">{d.price}</div>
                        </div>
                      </div>
                    </>
                  );
                })()}

              {type === 'suborbital' &&
                (() => {
                  const d = result.details as BookingResultSuborbital;
                  return (
                    <>
                      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-base">
                        <span>
                          {d.origin} → {d.arrival}
                        </span>
                        <span className="font-mono text-xs text-faint">{d.flightNumber}</span>
                      </div>
                      <div className="mb-3 text-[0.8125rem] text-dim">
                        {d.vehicle} · {d.operator}
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-3 border-t border-ghost pt-3">
                        <div>
                          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                            Cabin
                          </div>
                          <div className="text-[0.8125rem] text-sub">{d.cabin}</div>
                        </div>
                        <div>
                          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                            Berth
                          </div>
                          <div className="text-[0.8125rem] text-sub">{d.berth}</div>
                        </div>
                        <div>
                          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                            Launch window
                          </div>
                          <div className="text-[0.8125rem] text-sub">{d.launchWindow}</div>
                        </div>
                        <div>
                          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                            Re-entry corridor
                          </div>
                          <div className="text-[0.8125rem] text-sub">{d.reentryCorridor}</div>
                        </div>
                        <div>
                          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                            Duration
                          </div>
                          <div className="text-[0.8125rem] text-sub">{d.duration}</div>
                        </div>
                        <div>
                          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                            Peak
                          </div>
                          <div className="text-[0.8125rem] text-sub">{d.peakG}</div>
                        </div>
                      </div>
                      <div className="mt-3 border-t border-dashed border-ghost pt-3 text-[0.6875rem] italic text-faint">
                        Print ticket on arrival at HYD-O · biometric gate, no paper.
                      </div>
                    </>
                  );
                })()}

              {type === 'hotel' &&
                (() => {
                  const d = result.details as BookingResultHotel;
                  return (
                    <>
                      <div className="mb-1 text-base text-fg">{d.name}</div>
                      <div className="mb-3 text-[0.8125rem] text-dim">{d.hotelType}</div>
                      <div className="grid grid-cols-3 gap-2 border-t border-ghost pt-3">
                        <div>
                          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                            Nights
                          </div>
                          <div className="text-[0.8125rem] text-sub">{d.nights}</div>
                        </div>
                        <div>
                          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                            Rate
                          </div>
                          <div className="text-[0.8125rem] text-sub">{d.pricePerNight}</div>
                        </div>
                        <div>
                          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                            Code
                          </div>
                          <div className="text-[0.8125rem] text-sub">{d.confirmationCode}</div>
                        </div>
                      </div>
                    </>
                  );
                })()}

              {type === 'visa' &&
                (() => {
                  const d = result.details as BookingResultVisa;
                  return (
                    <>
                      <div className="mb-1 text-base text-fg">
                        {d.applicationType} · {d.country}
                      </div>
                      <div className="mb-3 text-[0.8125rem] text-dim">Status: {d.status}</div>
                      <div className="grid grid-cols-2 gap-2 border-t border-ghost pt-3">
                        <div>
                          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                            Processing
                          </div>
                          <div className="text-[0.8125rem] text-sub">{d.processingTime}</div>
                        </div>
                        <div>
                          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
                            App ID
                          </div>
                          <div className="text-[0.8125rem] text-sub">{d.applicationId}</div>
                        </div>
                      </div>
                    </>
                  );
                })()}
            </div>
          )}
        </div>
      </div>

      {/* Sticky footer actions */}
      <div
        className="sticky bottom-0 border-t border-ghost bg-bg px-6 py-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
        <div className="mx-auto flex max-w-[640px] gap-2.5">
          {done && (
            <Btn onClick={onClose} style={{ marginTop: 0 }}>
              Confirm booking
            </Btn>
          )}
          <Btn variant="outline" onClick={onClose} style={{ marginTop: 0 }}>
            {done ? 'Cancel' : 'Close'}
          </Btn>
        </div>
      </div>
    </div>
  );
}
