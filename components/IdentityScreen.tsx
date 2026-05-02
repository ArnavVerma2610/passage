'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import OnboardingShell from './OnboardingShell';
import DotMatrix, { BIG_PASSPORT_FRAMES } from './DotMatrix';
import Btn from './Btn';
import Flag from './Flag';
import { COUNTRIES_ACCESS, COUNTRIES_LIST } from '@/lib/data';
import type { Identity } from '@/lib/types';

interface IdentityScreenProps {
  initialName?: string;
  onComplete: (identity: Identity) => void;
}

const INPUT =
  'mb-3 w-full border border-ghost bg-surface px-3.5 py-3 font-mono text-sm text-fg outline-none';

const LABEL = 'mb-1.5 block text-[0.5625rem] uppercase tracking-[0.16em] text-faint';

export default function IdentityScreen({ initialName = '', onComplete }: IdentityScreenProps) {
  const [fullName, setFullName] = useState(initialName);
  const [dob, setDob] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [country, setCountry] = useState<string>('');
  const [countryQuery, setCountryQuery] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setCountryOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRIES_LIST;
    return COUNTRIES_LIST.filter(
      co => co.name.toLowerCase().includes(q) || co.code.toLowerCase().includes(q),
    );
  }, [countryQuery]);

  const selectedCountry = country ? COUNTRIES_ACCESS[country] : null;
  const ready = fullName.trim().length > 1 && dob && passportNumber.trim().length >= 4 && country;

  const submit = () => {
    if (!ready) return;
    onComplete({
      fullName: fullName.trim(),
      dateOfBirth: dob,
      passportNumber: passportNumber.trim().toUpperCase(),
      passportCountry: country,
      documentVerified: true,
    });
  };

  return (
    <OnboardingShell
      step="Step 2 — Identity"
      art={<DotMatrix frames={BIG_PASSPORT_FRAMES} intervalMs={650} dotSize={6} gap={4} />}
    >
      <h1 className="mb-2.5 text-[1.625rem] leading-tight">Verify your identity.</h1>
      <p className="mb-7 text-sm leading-relaxed text-dim">
        Required to compute your AMP score and pre-fill visa applications. We don&apos;t store this
        server-side in the demo.
      </p>

      <label className={LABEL}>Full legal name</label>
      <input
        value={fullName}
        onChange={e => setFullName(e.target.value)}
        placeholder="As shown on your passport"
        className={INPUT}
      />

      <label className={LABEL}>Date of birth</label>
      <input
        type="date"
        value={dob}
        onChange={e => setDob(e.target.value)}
        className={INPUT}
        style={{ colorScheme: 'dark' }}
      />

      <label className={LABEL}>Passport number</label>
      <input
        value={passportNumber}
        onChange={e => setPassportNumber(e.target.value)}
        placeholder="e.g. K1234567"
        className={INPUT}
      />

      <label className={LABEL}>Issuing country</label>
      <div ref={wrapRef} className="relative mb-4">
        <div
          onClick={() => setCountryOpen(true)}
          className={`flex cursor-text items-center gap-3 border bg-surface px-3.5 py-3 ${
            countryOpen || country ? 'border-fg' : 'border-ghost'
          }`}
        >
          {selectedCountry && !countryOpen && <Flag code={selectedCountry.code} size={22} />}
          <input
            value={countryOpen ? countryQuery : selectedCountry ? selectedCountry.name : ''}
            onChange={e => {
              setCountryQuery(e.target.value);
              setCountryOpen(true);
            }}
            onFocus={() => setCountryOpen(true)}
            placeholder="Search any country…"
            className="flex-1 border-0 bg-transparent font-mono text-sm text-fg outline-none"
          />
          <span className="text-xs text-faint">{countryOpen ? '▴' : '▾'}</span>
        </div>
        {countryOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-[280px] overflow-y-auto border border-ghost bg-surface">
            {filtered.length === 0 ? (
              <div className="px-3.5 py-3 text-[0.8125rem] text-faint">
                No country matches &ldquo;{countryQuery}&rdquo;.
              </div>
            ) : (
              filtered.map(co => {
                const isSelected = country === co.code;
                return (
                  <div
                    key={co.code}
                    onClick={() => {
                      setCountry(co.code);
                      setCountryQuery('');
                      setCountryOpen(false);
                    }}
                    className={`flex cursor-pointer items-center gap-3 border-b border-ghost px-3.5 py-2.5 ${
                      isSelected ? 'bg-active' : 'bg-transparent hover:bg-surface'
                    }`}
                  >
                    <Flag code={co.code} size={20} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-fg">{co.name}</div>
                      <div className="mt-0.5 text-[0.625rem] text-faint">
                        {co.code} · {co.visaFree} visa-free
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <Btn onClick={submit}>Verify identity →</Btn>
      {!ready && (
        <div className="mt-2.5 text-[0.625rem] text-faint">Fill all four fields to continue.</div>
      )}
    </OnboardingShell>
  );
}
