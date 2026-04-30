'use client';

import { useState } from 'react';
import OnboardingShell from './OnboardingShell';
import DotMatrix, { BIG_COMPASS_FRAMES } from './DotMatrix';
import Btn from './Btn';
import { c, MONO } from '@/lib/data';
import {
  AMP_CATEGORIES,
  type AmpProfile,
  categoryScore,
  computeAmpScore,
} from '@/lib/amp';

interface AmpFormScreenProps {
  initial: AmpProfile;
  onComplete: (profile: AmpProfile) => void;
}

export default function AmpFormScreen({ initial, onComplete }: AmpFormScreenProps) {
  const [profile, setProfile] = useState<AmpProfile>(initial);
  const [stepIdx, setStepIdx] = useState(0);

  const cat   = AMP_CATEGORIES[stepIdx];
  const isLast = stepIdx === AMP_CATEGORIES.length - 1;

  const setField = (fieldKey: string, value: number) => {
    setProfile(p => ({
      ...p,
      [cat.key]: { ...(p[cat.key] ?? {}), [fieldKey]: value },
    }));
  };

  const next = () => {
    if (isLast) onComplete(profile);
    else setStepIdx(stepIdx + 1);
  };
  const prev = () => { if (stepIdx > 0) setStepIdx(stepIdx - 1); };

  const totalScore = computeAmpScore(profile);
  const catScore   = categoryScore(profile, cat.key);

  return (
    <OnboardingShell
      step={`Step 3 — AMP · ${stepIdx + 1} / ${AMP_CATEGORIES.length}`}
      art={<DotMatrix frames={BIG_COMPASS_FRAMES} intervalMs={300} dotSize={6} gap={4} />}
    >
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        {AMP_CATEGORIES.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 2,
              background: i <= stepIdx ? c.fg : c.ghost,
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      <div style={{ fontSize: '0.75rem', color: c.faint, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
        {cat.icon}  {cat.title}
      </div>
      <div style={{ fontSize: '1.5rem', lineHeight: 1.2, marginBottom: 8 }}>
        {cat.title}
      </div>
      <div style={{ fontSize: '0.875rem', color: c.dim, lineHeight: 1.6, marginBottom: 24 }}>
        {cat.desc}
      </div>

      {cat.fields.map(f => {
        const value = profile[cat.key]?.[f.key] ?? 5;
        return (
          <div key={f.key} style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: '0.8125rem', color: c.fg }}>{f.label}</span>
              <span style={{ fontSize: '0.875rem', color: c.fg, fontFamily: MONO }}>{value}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={value}
              onChange={e => setField(f.key, parseInt(e.target.value))}
              style={{
                width: '100%',
                appearance: 'none',
                background: 'transparent',
                cursor: 'pointer',
                height: 24,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -2 }}>
              <span style={{ fontSize: '0.625rem', color: c.faint }}>{f.low}</span>
              <span style={{ fontSize: '0.625rem', color: c.faint }}>{f.high}</span>
            </div>
          </div>
        );
      })}

      {/* Live category + total readout */}
      <div style={{
        marginTop: 8, marginBottom: 18,
        padding: '12px 14px',
        background: c.surface, border: `1px solid ${c.ghost}`,
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div>
          <div style={{ fontSize: '0.5625rem', color: c.faint, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Category contribution
          </div>
          <div style={{ fontSize: '1rem', color: c.fg, fontFamily: MONO }}>
            {catScore.score} <span style={{ color: c.faint, fontSize: '0.75rem' }}>/ {catScore.max}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.5625rem', color: c.faint, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            AMP running total
          </div>
          <div style={{ fontSize: '1rem', color: c.fg, fontFamily: MONO }}>
            {totalScore} <span style={{ color: c.faint, fontSize: '0.75rem' }}>/ 1000</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {stepIdx > 0 && (
          <Btn variant="outline" onClick={prev}>← Back</Btn>
        )}
        <Btn onClick={next}>{isLast ? 'Compute AMP score →' : 'Next category →'}</Btn>
      </div>
    </OnboardingShell>
  );
}
