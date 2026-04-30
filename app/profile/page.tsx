'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Flag from '@/components/Flag';
import Btn from '@/components/Btn';
import { c, MONO, COUNTRIES_ACCESS, PROFILE_SLIDES } from '@/lib/data';
import { usePassageStore } from '@/lib/store';

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
  const profile      = usePassageStore(s => s.profile);
  const fontSize     = usePassageStore(s => s.fontSize);
  const setFontSize  = usePassageStore(s => s.setFontSize);
  const resetOnboarding = usePassageStore(s => s.resetOnboarding);

  useEffect(() => {
    if (_hasHydrated && !passport) router.replace('/');
  }, [_hasHydrated, passport, router]);

  if (!_hasHydrated || !passport) return null;

  const data = COUNTRIES_ACCESS[passport];

  const handleReset = () => { resetOnboarding(); router.push('/'); };

  return (
    <div style={{ fontFamily: MONO, minHeight: '100vh', fontSize: '0.875rem', lineHeight: 1.55, paddingBottom: 80 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 24px' }}>

        {/* Passport hero */}
        <div style={{ textAlign: 'center', marginBottom: 32, paddingTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: 12 }}><Flag code={data.code} size={52} /></div>
          <div style={{ fontSize: '1.25rem' }}>{data.name}</div>
          <div style={{ fontSize: '0.8125rem', color: c.faint, marginTop: 5 }}>Mobility score: {data.score}/100</div>
        </div>

        {/* Travel profile */}
        <div style={{ fontSize: '0.5625rem', letterSpacing: '0.14em', color: c.faint, marginBottom: 14, textTransform: 'uppercase' }}>Travel profile</div>
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

        {/* Access breakdown */}
        <div style={{ fontSize: '0.5625rem', letterSpacing: '0.14em', color: c.faint, marginBottom: 14, marginTop: 32, textTransform: 'uppercase' }}>Access breakdown</div>
        {([
          ['Visa-free', data.visaFree, c.fg],
          ['Restricted', data.restricted, c.dim],
          ['Impossible', data.impossible, c.danger],
        ] as const).map(([l, v, col]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${c.ghost}` }}>
            <span style={{ fontSize: '0.8125rem', color: c.dim }}>{l}</span>
            <span style={{ fontSize: '0.8125rem', color: col }}>{v}</span>
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

        <div style={{ marginTop: 32 }}>
          <Btn variant="outline" onClick={handleReset}>
            Passport swap — see another world
          </Btn>
        </div>
      </div>
    </div>
  );
}
