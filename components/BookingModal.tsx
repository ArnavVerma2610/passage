'use client';

import { useState, useEffect, useRef } from 'react';
import { c, MONO } from '@/lib/data';
import Btn from '@/components/Btn';
import type { BookingType, Destination, BookingResult, BookingResultFlight, BookingResultHotel, BookingResultVisa } from '@/lib/types';

interface BookingModalProps {
  type: BookingType;
  dest: Destination;
  onClose: () => void;
}

interface Step { label: string; ms: number; }

function wait(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

function stepsFor(type: BookingType, dest: Destination): Step[] {
  if (type === 'flight') return [
    { label: "Connecting to MakeMyTrip...", ms: 700 },
    { label: `Searching flights to ${dest.travelPlan.flights.to}...`, ms: 800 },
    { label: "Optimizing for price and timing...", ms: 600 },
    { label: "Confirming booking...", ms: 0 },
  ];
  if (type === 'hotel') return [
    { label: "Connecting to MakeMyTrip...", ms: 700 },
    { label: `Searching stays near ${dest.name}...`, ms: 800 },
    { label: "Checking availability...", ms: 600 },
    { label: "Confirming reservation...", ms: 0 },
  ];
  return [
    { label: "Checking visa requirements...", ms: 700 },
    { label: "Analyzing your travel profile...", ms: 800 },
    { label: "Preparing application...", ms: 600 },
    { label: "Submitting application...", ms: 0 },
  ];
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

    return () => { cancelRef.current = true; };
  }, []);

  const done = result !== null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 300, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 28px" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.15em", color: c.faint, marginBottom: 16, textTransform: "uppercase" }}>
        @makemytrip integration
      </div>

      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", opacity: i <= step ? 1 : 0.15, transition: "opacity 0.4s" }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: i < step ? c.fg : (done && i === step) ? "#446644" : "transparent",
            border: i <= step ? `1px solid ${c.fg}` : `1px solid ${c.faint}`,
            transition: "all 0.3s",
          }} />
          <span style={{ fontSize: 13, color: i <= step ? c.sub : c.faint }}>{s.label}</span>
        </div>
      ))}

      {error && (
        <div style={{ marginTop: 20, fontSize: 13, color: "#aa0000" }}>{error}</div>
      )}

      {done && result && (
        <div style={{ marginTop: 28, padding: "16px", border: `1px solid ${c.ghost}` }}>
          <div style={{ fontSize: 10, color: c.faint, letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>
            Ref: {result.bookingRef}
          </div>

          {type === 'flight' && (() => {
            const d = result.details as BookingResultFlight;
            return (
              <>
                <div style={{ fontSize: 14, marginBottom: 4 }}>{d.from} → {d.to}</div>
                <div style={{ fontSize: 13, color: c.dim }}>{d.airline} · {d.class}</div>
                <div style={{ fontSize: 12, color: c.faint, marginTop: 4 }}>{d.duration} · {d.price} · Seat {d.seat}</div>
              </>
            );
          })()}

          {type === 'hotel' && (() => {
            const d = result.details as BookingResultHotel;
            return (
              <>
                <div style={{ fontSize: 14, marginBottom: 4 }}>{d.name}</div>
                <div style={{ fontSize: 13, color: c.dim }}>{d.hotelType} · {d.nights} nights</div>
                <div style={{ fontSize: 12, color: c.faint, marginTop: 4 }}>{d.pricePerNight} · Code: {d.confirmationCode}</div>
              </>
            );
          })()}

          {type === 'visa' && (() => {
            const d = result.details as BookingResultVisa;
            return (
              <>
                <div style={{ fontSize: 14, marginBottom: 4 }}>{d.applicationType} for {d.country}</div>
                <div style={{ fontSize: 13, color: c.dim }}>Status: {d.status}</div>
                <div style={{ fontSize: 12, color: c.faint, marginTop: 4 }}>Processing: {d.processingTime} · ID: {d.applicationId}</div>
              </>
            );
          })()}
        </div>
      )}

      <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
        {done && <Btn onClick={onClose}>Confirm booking</Btn>}
        <Btn variant="outline" onClick={onClose} style={{ marginTop: 0 }}>{done ? "Cancel" : "Close"}</Btn>
      </div>
    </div>
  );
}
