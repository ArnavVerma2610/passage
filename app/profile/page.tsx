'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Flag from '@/components/Flag';
import Btn from '@/components/Btn';
import { c, MONO, COUNTRIES_ACCESS, PROFILE_SLIDES } from '@/lib/data';
import { usePassageStore } from '@/lib/store';
import {
  AMP_CATEGORIES,
  categoryScore,
  computeAmpScore,
  getTier,
  TIER_META,
} from '@/lib/amp';

const FONT_SIZES = [
  { value: 14, label: 'Compact' },
  { value: 16, label: 'Default' },
  { value: 18, label: 'Large' },
  { value: 20, label: 'Extra large' },
] as const;

export default function ProfilePage() {
  const router = useRouter();

  const _hasHydrated = usePassageStore(s => s._hasHydrated);
  const passport     = usePassageStore(s => s.passport);
  const user         = usePassageStore(s => s.user);
  const identity     = usePassageStore(s => s.identity);
  const amp          = usePassageStore(s => s.amp);
  const profile      = usePassageStore(s => s.profile);
  const fontSize     = usePassageStore(s => s.fontSize);
  const setFontSize  = usePassageStore(s => s.setFontSize);
  const resetOnboarding = usePassageStore(s => s.resetOnboarding);
  const signOut         = usePassageStore(s => s.signOut);

  useEffect(() => {
    if (_hasHydrated && !passport) router.replace('/');
  }, [_hasHydrated, passport, router]);

  if (!_hasHydrated || !passport) return null;

  const data  = COUNTRIES_ACCESS[passport];
  const score = computeAmpScore(amp);
  const tier  = getTier(score);
  const meta  = TIER_META[tier];

  const handleReset = () => { resetOnboarding(); router.push('/'); };
  const handleSignOut = () => { signOut(); router.push('/'); };

  return (
    <div style={{ fontFamily: MONO, minHeight: '100vh', fontSize: '0.875rem', lineHeight: 1.55, paddingBottom: 80 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 24px' }}>

        {/* Account hero */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, padding: '14px 0', borderBottom: `1px solid ${c.ghost}` }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              border: `1px solid ${c.fg}`, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontFamily: MONO, fontSize: '0.875rem', color: c.fg,
            }}>
              {user.avatarInitials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.9375rem', color: c.fg }}>{user.name}</div>
              <div style={{ fontSize: '0.6875rem', color: c.faint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email} · via {user.provider}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              style={{ background: 'none', border: `1px solid ${c.ghost}`, color: c.dim, fontFamily: MONO, fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 12px', cursor: 'pointer' }}
            >
              Sign out
            </button>
          </div>
        )}

        {/* AMP score hero */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: '0.625rem', color: c.faint, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
            AI mobility profile
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: '3rem', lineHeight: 1, fontFamily: MONO }}>{score}</span>
            <span style={{ fontSize: '0.875rem', color: c.faint }}>/ 1000</span>
          </div>
          <div style={{ width: '100%', height: 2, background: c.ghost, marginBottom: 14, position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: 2,
              width: `${(score / 1000) * 100}%`,
              background: meta.color,
            }} />
          </div>
          <div style={{
            padding: '12px 14px', border: `1px solid ${meta.color}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
          }}>
            <span style={{ fontSize: '0.625rem', color: c.faint, letterSpacing: '0.18em' }}>{meta.short}</span>
            <span style={{ fontSize: '1rem', color: meta.color }}>{meta.label}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: c.dim, lineHeight: 1.6, marginTop: 10 }}>
            {meta.desc}
          </div>
        </div>

        {/* Per-category breakdown */}
        <div style={{ fontSize: '0.5625rem', letterSpacing: '0.14em', color: c.faint, marginBottom: 14, textTransform: 'uppercase' }}>
          AMP breakdown
        </div>
        {AMP_CATEGORIES.map(cat => {
          const v = categoryScore(amp, cat.key);
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
                  width: `${pct}%`, background: meta.color,
                }} />
              </div>
            </div>
          );
        })}

        {/* Identity card */}
        {identity && (
          <>
            <div style={{ fontSize: '0.5625rem', letterSpacing: '0.14em', color: c.faint, marginBottom: 14, marginTop: 32, textTransform: 'uppercase' }}>
              Identity
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: `1px solid ${c.ghost}` }}>
              <Flag code={data.code} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem' }}>{identity.fullName}</div>
                <div style={{ fontSize: '0.6875rem', color: c.faint }}>
                  {data.name} · Passport {identity.passportNumber}
                </div>
              </div>
              {identity.documentVerified && (
                <span style={{ fontSize: '0.5625rem', color: c.fg, border: `1px solid ${c.fg}`, padding: '3px 8px', letterSpacing: '0.1em' }}>
                  VERIFIED
                </span>
              )}
            </div>
          </>
        )}

        {/* Travel preferences */}
        <div style={{ fontSize: '0.5625rem', letterSpacing: '0.14em', color: c.faint, marginBottom: 14, marginTop: 32, textTransform: 'uppercase' }}>
          Travel preferences
        </div>
        {PROFILE_SLIDES.map(sl => (
          <div key={sl.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${c.ghost}` }}>
            <span style={{ fontSize: '0.8125rem', color: c.dim }}>{sl.icon} {sl.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 60, height: 2, background: c.ghost, position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: 2, width: `${profile[sl.key] * 10}%`, background: c.fg }} />
              </div>
              <span style={{ fontSize: '0.8125rem', width: 16, textAlign: 'right' }}>{profile[sl.key]}</span>
            </div>
          </div>
        ))}

        {/* Font size setting */}
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: '0.5625rem', letterSpacing: '0.14em', color: c.faint, marginBottom: 14, textTransform: 'uppercase' }}>Text size</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {FONT_SIZES.map(s => {
              const active = fontSize === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setFontSize(s.value)}
                  style={{
                    background: active ? '#111' : 'none',
                    border: `1px solid ${active ? c.fg : c.ghost}`,
                    cursor: 'pointer', padding: '14px 8px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontFamily: MONO, fontSize: s.value + 'px', color: c.fg }}>Aa</span>
                  <span style={{ fontSize: '0.5625rem', color: active ? c.sub : c.faint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 32, display: 'flex', gap: 8, flexDirection: 'column' }}>
          <Btn variant="outline" onClick={handleReset}>
            Re-run onboarding
          </Btn>
        </div>
      </div>
    </div>
  );
}
