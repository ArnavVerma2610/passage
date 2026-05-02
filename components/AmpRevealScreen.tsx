'use client';

import { useEffect, useState } from 'react';
import OnboardingShell from './OnboardingShell';
import DotMatrix, { BIG_SCORE_FRAMES } from './DotMatrix';
import Btn from './Btn';
import {
  AMP_CATEGORIES,
  type AmpProfile,
  categoryScore,
  computeAmpScore,
  getTier,
  TIER_META,
} from '@/lib/amp';

interface AmpRevealScreenProps {
  profile: AmpProfile;
  onContinue: () => void;
}

export default function AmpRevealScreen({ profile, onContinue }: AmpRevealScreenProps) {
  const score = computeAmpScore(profile);
  const tier = getTier(score);
  const meta = TIER_META[tier];

  const [animScore, setAnimScore] = useState(0);
  const [showBars, setShowBars] = useState(false);

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

  return (
    <OnboardingShell
      step="Step 3 — AMP score"
      art={<DotMatrix frames={BIG_SCORE_FRAMES} intervalMs={420} dotSize={6} gap={4} />}
    >
      <div className="mb-2 text-[0.625rem] uppercase tracking-[0.18em] text-faint">
        Your AI Mobility Profile
      </div>
      <div className="mb-1 flex items-baseline gap-3">
        <span className="font-mono text-7xl leading-none">{animScore}</span>
        <span className="text-sm text-faint">/ 1000</span>
      </div>
      <div className="relative mb-[22px] mt-3.5 h-0.5 w-full bg-ghost">
        <div
          className="absolute left-0 top-0 h-0.5 transition-[width] duration-100 ease-linear"
          style={{ width: `${(animScore / 1000) * 100}%`, background: meta.color }}
        />
      </div>

      <div className="mb-6 border bg-surface p-[18px]" style={{ borderColor: meta.color }}>
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-[0.625rem] uppercase tracking-[0.18em] text-faint">
            {meta.short}
          </span>
          <span className="text-lg" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>
        <div className="mb-3 text-[0.8125rem] leading-relaxed text-dim">{meta.desc}</div>
        <ul className="m-0 list-disc pl-4 text-xs leading-[1.7] text-dim">
          {meta.perks.map(p => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      <div className="mb-2.5 text-[0.5625rem] uppercase tracking-[0.16em] text-faint">
        Category breakdown
      </div>
      <div className="mb-6">
        {AMP_CATEGORIES.map((cat, i) => {
          const v = categoryScore(profile, cat.key);
          const pct = v.max > 0 ? (v.score / v.max) * 100 : 0;
          return (
            <div key={cat.key} className="mb-3">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-dim">
                  {cat.icon} {cat.title}
                </span>
                <span className="font-mono text-faint">
                  {v.score} / {v.max}
                </span>
              </div>
              <div className="relative h-0.5 w-full bg-ghost">
                <div
                  className="absolute left-0 top-0 h-0.5 ease-out"
                  style={{
                    width: showBars ? `${pct}%` : '0%',
                    background: meta.color,
                    transition: `width 0.7s ease-out ${i * 0.08}s`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Btn onClick={onContinue}>Continue to travel preferences →</Btn>
    </OnboardingShell>
  );
}
