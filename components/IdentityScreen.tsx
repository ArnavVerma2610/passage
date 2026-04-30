'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import OnboardingShell from './OnboardingShell';
import DotMatrix, { BIG_PASSPORT_FRAMES } from './DotMatrix';
import Btn from './Btn';
import Flag from './Flag';
import { c, MONO, COUNTRIES_LIST, COUNTRIES_ACCESS } from '@/lib/data';
import type { Identity } from '@/lib/types';

interface IdentityScreenProps {
  initialName?: string;
  onComplete: (identity: Identity) => void;
}

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
    return COUNTRIES_LIST.filter(co =>
      co.name.toLowerCase().includes(q) || co.code.toLowerCase().includes(q)
    );
  }, [countryQuery]);

  const selectedCountry = country ? COUNTRIES_ACCESS[country] : null;

  const ready = fullName.trim().length > 1 && dob && passportNumber.trim().length >= 4 && country;

  const inputStyle: React.CSSProperties = {
    width: '100%', background: c.surface, border: `1px solid ${c.ghost}`,
    color: c.fg, fontFamily: MONO, fontSize: '0.875rem',
    padding: '13px 14px', outline: 'none', marginBottom: 12,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.5625rem', letterSpacing: '0.16em', color: c.faint,
    textTransform: 'uppercase', marginBottom: 6, display: 'block',
  };

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
      <div style={{ fontSize: '1.625rem', lineHeight: 1.2, marginBottom: 10 }}>
        Verify your identity.
      </div>
      <div style={{ fontSize: '0.875rem', color: c.dim, lineHeight: 1.65, marginBottom: 28 }}>
        Required to compute your AMP score and pre-fill visa applications.
        We don't store this server-side in the demo.
      </div>

      <label style={labelStyle}>Full legal name</label>
      <input
        value={fullName}
        onChange={e => setFullName(e.target.value)}
        placeholder="As shown on your passport"
        style={inputStyle}
      />

      <label style={labelStyle}>Date of birth</label>
      <input
        type="date"
        value={dob}
        onChange={e => setDob(e.target.value)}
        style={{ ...inputStyle, colorScheme: 'dark' as React.CSSProperties['colorScheme'] }}
      />

      <label style={labelStyle}>Passport number</label>
      <input
        value={passportNumber}
        onChange={e => setPassportNumber(e.target.value)}
        placeholder="e.g. K1234567"
        style={inputStyle}
      />

      <label style={labelStyle}>Issuing country</label>
      <div ref={wrapRef} style={{ position: 'relative', marginBottom: 18 }}>
        <div
          onClick={() => setCountryOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '13px 14px',
            border: `1px solid ${countryOpen || country ? c.fg : c.ghost}`,
            cursor: 'text',
            background: c.surface,
          }}
        >
          {selectedCountry && !countryOpen && <Flag code={selectedCountry.code} size={22} />}
          <input
            value={countryOpen ? countryQuery : selectedCountry ? selectedCountry.name : ''}
            onChange={e => { setCountryQuery(e.target.value); setCountryOpen(true); }}
            onFocus={() => setCountryOpen(true)}
            placeholder="Search any country…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: c.fg, fontFamily: MONO, fontSize: '0.875rem',
            }}
          />
          <span style={{ color: c.faint, fontSize: '0.75rem' }}>{countryOpen ? '▴' : '▾'}</span>
        </div>
        {countryOpen && (
          <div
            style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              maxHeight: 280, overflowY: 'auto',
              border: `1px solid ${c.ghost}`, background: c.surface,
              zIndex: 20,
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: '0.8125rem', color: c.faint }}>
                No country matches "{countryQuery}".
              </div>
            ) : filtered.map(co => {
              const isSelected = country === co.code;
              return (
                <div
                  key={co.code}
                  onClick={() => { setCountry(co.code); setCountryQuery(''); setCountryOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderBottom: `1px solid ${c.ghost}`,
                    cursor: 'pointer',
                    background: isSelected ? '#111' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#0d0d0d'; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <Flag code={co.code} size={20} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', color: c.fg }}>{co.name}</div>
                    <div style={{ fontSize: '0.625rem', color: c.faint, marginTop: 2 }}>
                      {co.code} · {co.visaFree} visa-free
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Btn onClick={submit}>Verify identity →</Btn>
      {!ready && (
        <div style={{ marginTop: 10, fontSize: '0.625rem', color: c.faint }}>
          Fill all four fields to continue.
        </div>
      )}
    </OnboardingShell>
  );
}
