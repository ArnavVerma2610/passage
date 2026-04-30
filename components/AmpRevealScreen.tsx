'use client';

import { useEffect, useState } from 'react';
import OnboardingShell from './OnboardingShell';
import DotMatrix, { BIG_SCORE_FRAMES } from './DotMatrix';
import Btn from './Btn';
import { c, MONO } from '@/lib/data';
import {
  AMP_CATEGORIES,
  type AmpProfile,
  computeAmpScore,
  categoryScore,
  getTier,
  TIER_META,
} from '@/lib/amp';

interface AmpRevealScreenProps {
  profile: AmpProfile;
  onContinue: () => void;
}

export default function AmpRevealScreen({ profile, onContinue }: AmpRevealScreenProps) {
  const score = computeAmpScore(profile);
  const tier  = getTier(score);
  const meta  = TIER_META[tier];

  const [animScore, setAnimScore] = useState(0);
  const [showBars, setShowBars]   = useState(false);

  useEffect(() => {
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimScore(Math.round(score * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setShowBars(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const widthPct = (score / 1000) * 100;

  return (
    <OnboardingShell
      step="Step 3 — AMP score"
      art={<DotMatrix frames={BIG_SCORE_FRAMES} intervalMs={420} dotSize={6} gap={4} />}
    >
      <div style={{ fontSize: '0.625rem', color: c.faint, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>
        Your AI Mobility Profile
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: '4.5rem', lineHeight: 1, fontFamily: MONO }}>{animScore}</span>
        <span style={{ fontSize: '0.875rem', color: c.faint }}>/ 1000</span>
      </div>
      <div style={{ width: '100%', height: 2, background: c.ghost, marginTop: 14, marginBottom: 22, position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: 2,
          width: `${(animScore / 1000) * 100}%`,
          background: meta.color,
          transition: 'width 0.1s linear',
        }} />
      </div>

      {/* Tier card */}
      <div style={{
        padding: '18px',
        border: `1px solid ${meta.color}`,
        background: c.surface,
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: '0.625rem', color: c.faint, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            {meta.short}
          </span>
          <span style={{ fontSize: '1.125rem', color: meta.color }}>{meta.label}</span>
        </div>
        <div style={{ fontSize: '0.8125rem', color: c.dim, lineHeight: 1.6, marginBottom: 12 }}>
          {meta.desc}
        </div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.75rem', color: c.dim, lineHeight: 1.7 }}>
          {meta.perks.map(p => <li key={p}>{p}</li>)}
        </ul>
      </div>

      {/* Per-category breakdown */}
      <div style={{ fontSize: '0.5625rem', color: c.faint, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10 }}>
        Category breakdown
      </div>
      <div style={{ marginBottom: 24 }}>
        {AMP_CATEGORIES.map((cat, i) => {
          const v = categoryScore(profile, cat.key);
          const pct = v.max > 0 ? (v.score / v.max) * 100 : 0;
          return (
            <div key={cat.key} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                <span style={{ color: c.dim }}>{cat.icon}  {cat.title}</span>
                <span style={{ color: c.faint, fontFamily: MONO }}>{v.score} / {v.max}</span>
              </div>
              <div style={{ width: '100%', height: 2, background: c.ghost, position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: 2,
                  width: showBars ? `${pct}%` : '0%',
                  background: meta.color,
                  transition: `width 0.7s ease-out ${i * 0.08}s`,
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <Btn onClick={onContinue}>Continue to travel preferences →</Btn>
    </OnboardingShell>
  );
}
