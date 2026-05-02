'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Btn from '@/components/Btn';
import Flag from '@/components/Flag';
import { COUNTRIES_ACCESS, PROFILE_SLIDES } from '@/lib/data';
import { usePassageStore } from '@/lib/store';
import { AMP_CATEGORIES, categoryScore, computeAmpScore, getTier, TIER_META } from '@/lib/amp';

const FONT_SIZES = [
  { value: 14, label: 'Compact' },
  { value: 16, label: 'Default' },
  { value: 18, label: 'Large' },
  { value: 20, label: 'Extra large' },
] as const;

export default function ProfilePage() {
  const router = useRouter();

  const _hasHydrated = usePassageStore(s => s._hasHydrated);
  const passport = usePassageStore(s => s.passport);
  const user = usePassageStore(s => s.user);
  const identity = usePassageStore(s => s.identity);
  const amp = usePassageStore(s => s.amp);
  const profile = usePassageStore(s => s.profile);
  const fontSize = usePassageStore(s => s.fontSize);
  const setFontSize = usePassageStore(s => s.setFontSize);
  const resetOnboarding = usePassageStore(s => s.resetOnboarding);
  const signOut = usePassageStore(s => s.signOut);

  useEffect(() => {
    if (_hasHydrated && !passport) router.replace('/');
  }, [_hasHydrated, passport, router]);

  if (!_hasHydrated || !passport) return null;

  const data = COUNTRIES_ACCESS[passport];
  const score = computeAmpScore(amp);
  const tier = getTier(score);
  const meta = TIER_META[tier];

  const handleReset = () => {
    resetOnboarding();
    router.push('/');
  };
  const handleSignOut = () => {
    signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen pb-20 text-sm leading-[1.55]">
      <div className="mx-auto max-w-[720px] px-6 py-7">
        {user && (
          <div className="mb-7 flex items-center gap-3.5 border-b border-ghost py-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-fg font-mono text-sm text-fg">
              {user.avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[0.9375rem] text-fg">{user.name}</div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.6875rem] text-faint">
                {user.email} · via {user.provider}
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="cursor-pointer border border-ghost bg-transparent px-3 py-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-dim"
            >
              Sign out
            </button>
          </div>
        )}

        <div className="mb-8">
          <div className="mb-1.5 text-[0.625rem] uppercase tracking-[0.18em] text-faint">
            AI mobility profile
          </div>
          <div className="mb-1.5 flex items-baseline gap-3">
            <span className="font-mono text-5xl leading-none">{score}</span>
            <span className="text-sm text-faint">/ 1000</span>
          </div>
          <div className="relative mb-3.5 h-0.5 w-full bg-ghost">
            <div
              className="absolute left-0 top-0 h-0.5"
              style={{ width: `${(score / 1000) * 100}%`, background: meta.color }}
            />
          </div>
          <div
            className="flex flex-wrap items-center justify-between gap-2 border px-3.5 py-3"
            style={{ borderColor: meta.color }}
          >
            <span className="text-[0.625rem] tracking-[0.18em] text-faint">{meta.short}</span>
            <span className="text-base" style={{ color: meta.color }}>
              {meta.label}
            </span>
          </div>
          <div className="mt-2.5 text-xs leading-relaxed text-dim">{meta.desc}</div>
        </div>

        <div className="mb-3.5 text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
          AMP breakdown
        </div>
        {AMP_CATEGORIES.map(cat => {
          const v = categoryScore(amp, cat.key);
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
                  className="absolute left-0 top-0 h-0.5"
                  style={{ width: `${pct}%`, background: meta.color }}
                />
              </div>
            </div>
          );
        })}

        {identity && (
          <>
            <div className="mb-3.5 mt-8 text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
              Identity
            </div>
            <div className="flex items-center gap-3.5 border-b border-ghost py-3.5">
              <Flag code={data.code} size={36} />
              <div className="min-w-0 flex-1">
                <div className="text-sm">{identity.fullName}</div>
                <div className="text-[0.6875rem] text-faint">
                  {data.name} · Passport {identity.passportNumber}
                </div>
              </div>
              {identity.documentVerified && (
                <span className="border border-fg px-2 py-[3px] text-[0.5625rem] tracking-[0.1em] text-fg">
                  VERIFIED
                </span>
              )}
            </div>
          </>
        )}

        <div className="mb-3.5 mt-8 text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
          Travel preferences
        </div>
        {PROFILE_SLIDES.map(sl => (
          <div key={sl.key} className="flex justify-between border-b border-ghost py-3">
            <span className="text-[0.8125rem] text-dim">
              {sl.icon} {sl.label}
            </span>
            <div className="flex items-center gap-2.5">
              <div className="relative h-0.5 w-[60px] bg-ghost">
                <div
                  className="absolute left-0 top-0 h-0.5 bg-fg"
                  style={{ width: `${profile[sl.key] * 10}%` }}
                />
              </div>
              <span className="w-4 text-right text-[0.8125rem]">{profile[sl.key]}</span>
            </div>
          </div>
        ))}

        <div className="mt-8">
          <div className="mb-3.5 text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
            Text size
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {FONT_SIZES.map(s => {
              const active = fontSize === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setFontSize(s.value)}
                  className={`flex cursor-pointer flex-col items-center gap-1.5 border px-2 py-3.5 transition-all ${
                    active ? 'border-fg bg-active' : 'border-ghost bg-transparent'
                  }`}
                >
                  <span className="font-mono text-fg" style={{ fontSize: `${s.value}px` }}>
                    Aa
                  </span>
                  <span
                    className={`text-[0.5625rem] uppercase tracking-[0.06em] ${
                      active ? 'text-sub' : 'text-faint'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <Btn variant="outline" onClick={handleReset}>
            Re-run onboarding
          </Btn>
        </div>
      </div>
    </div>
  );
}
