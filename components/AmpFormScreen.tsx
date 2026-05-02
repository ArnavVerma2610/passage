'use client';

import { useState } from 'react';
import OnboardingShell from './OnboardingShell';
import DotMatrix, { BIG_COMPASS_FRAMES } from './DotMatrix';
import Btn from './Btn';
import { AMP_CATEGORIES, type AmpProfile, categoryScore, computeAmpScore } from '@/lib/amp';

interface AmpFormScreenProps {
  initial: AmpProfile;
  onComplete: (profile: AmpProfile) => void;
}

export default function AmpFormScreen({ initial, onComplete }: AmpFormScreenProps) {
  const [profile, setProfile] = useState<AmpProfile>(initial);
  const [stepIdx, setStepIdx] = useState(0);

  const cat = AMP_CATEGORIES[stepIdx];
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
  const prev = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  };

  const totalScore = computeAmpScore(profile);
  const catScore = categoryScore(profile, cat.key);

  return (
    <OnboardingShell
      step={`Step 3 — AMP · ${stepIdx + 1} / ${AMP_CATEGORIES.length}`}
      art={<DotMatrix frames={BIG_COMPASS_FRAMES} intervalMs={300} dotSize={6} gap={4} />}
    >
      <div className="mb-7 flex gap-1.5">
        {AMP_CATEGORIES.map((_, i) => (
          <div
            key={i}
            className={`h-0.5 flex-1 transition-colors ${i <= stepIdx ? 'bg-fg' : 'bg-ghost'}`}
          />
        ))}
      </div>

      <div className="mb-1.5 text-xs uppercase tracking-[0.18em] text-faint">
        {cat.icon} {cat.title}
      </div>
      <h2 className="mb-2 text-2xl leading-tight">{cat.title}</h2>
      <p className="mb-6 text-sm leading-relaxed text-dim">{cat.desc}</p>

      {cat.fields.map(f => {
        const value = profile[cat.key]?.[f.key] ?? 5;
        return (
          <div key={f.key} className="mb-[22px]">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-[0.8125rem] text-fg">{f.label}</span>
              <span className="font-mono text-sm text-fg">{value}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={value}
              onChange={e => setField(f.key, parseInt(e.target.value, 10))}
              className="h-6 w-full cursor-pointer appearance-none bg-transparent"
            />
            <div className="-mt-0.5 flex justify-between text-[0.625rem] text-faint">
              <span>{f.low}</span>
              <span>{f.high}</span>
            </div>
          </div>
        );
      })}

      <div className="mb-[18px] mt-2 flex flex-wrap justify-between gap-2 border border-ghost bg-surface px-3.5 py-3">
        <div>
          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
            Category contribution
          </div>
          <div className="font-mono text-base text-fg">
            {catScore.score} <span className="text-xs text-faint">/ {catScore.max}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
            AMP running total
          </div>
          <div className="font-mono text-base text-fg">
            {totalScore} <span className="text-xs text-faint">/ 1000</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5">
        {stepIdx > 0 && (
          <Btn variant="outline" onClick={prev}>
            ← Back
          </Btn>
        )}
        <Btn onClick={next}>{isLast ? 'Compute AMP score →' : 'Next category →'}</Btn>
      </div>
    </OnboardingShell>
  );
}
