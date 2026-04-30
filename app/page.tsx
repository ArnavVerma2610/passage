'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Flag from '@/components/Flag';
import Btn from '@/components/Btn';
import SliderInput from '@/components/SliderInput';
import { c, MONO, COUNTRIES_ACCESS, PROFILE_SLIDES } from '@/lib/data';
import { usePassageStore } from '@/lib/store';
import type { ProfileValues } from '@/lib/types';

type OnboardingScreen = 'welcome' | 'passport' | 'profile' | 'mobility';

const WRAP: React.CSSProperties = {
  fontFamily: MONO, minHeight: '100vh', fontSize: '0.875rem',
  lineHeight: 1.6, letterSpacing: '-0.01em',
};

const INNER: React.CSSProperties = {
  maxWidth: 480, margin: '0 auto', padding: '0 28px',
};

// ── Welcome ───────────────────────────────────────────────────────────────────

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 200); }, []);
  return (
    <div style={{ ...WRAP, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', opacity: vis ? 1 : 0, transition: 'opacity 1s' }}>
      <div style={{ ...INNER, paddingBottom: 60, paddingTop: 60 }}>
        <div style={{ fontSize: '0.625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: c.faint, marginBottom: 14 }}>passage</div>
        <div style={{ fontSize: '1.875rem', lineHeight: 1.2, marginBottom: 18 }}>
          The world isn't<br />the same size<br />for everyone.
        </div>
        <div style={{ fontSize: '0.875rem', color: c.dim, lineHeight: 1.7, marginBottom: 52 }}>
          See the places you can actually reach.<br />
          Get paired with people attempting the same<br />
          crossing from a different starting point.
        </div>
        <Btn onClick={onStart}>Begin</Btn>
      </div>
    </div>
  );
}

// ── Passport ──────────────────────────────────────────────────────────────────

function PassportScreen({ onSelect }: { onSelect: (code: string) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const countries = Object.values(COUNTRIES_ACCESS);

  return (
    <div style={{ ...WRAP, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ ...INNER, paddingTop: 40, paddingBottom: 40 }}>
        <div style={{ fontSize: '0.625rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: c.faint, marginBottom: 6 }}>Step 1 of 3</div>
        <div style={{ fontSize: '1.375rem', marginBottom: 6 }}>Your passport</div>
        <div style={{ fontSize: '0.875rem', color: c.dim, marginBottom: 28 }}>This determines your world.</div>

        <div style={{ marginBottom: 28 }}>
          {countries.map(co => {
            const isSelected = sel === co.code;
            return (
              <div
                key={co.code}
                onClick={() => setSel(co.code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 0', borderBottom: `1px solid ${c.ghost}`,
                  cursor: 'pointer', transition: 'opacity 0.15s',
                  opacity: sel && !isSelected ? 0.45 : 1,
                }}
              >
                <Flag code={co.code} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9375rem', color: c.fg }}>{co.name}</div>
                  <div style={{ fontSize: '0.6875rem', color: c.faint, marginTop: 2 }}>
                    Mobility {co.score}/100 · {co.visaFree} countries visa-free
                  </div>
                </div>
                <div style={{
                  width: 18, height: 18, flexShrink: 0,
                  border: `1px solid ${isSelected ? c.fg : c.ghost}`,
                  background: isSelected ? c.fg : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.625rem', color: c.bg, transition: 'all 0.15s',
                }}>
                  {isSelected ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>

        {sel && <Btn onClick={() => onSelect(sel)}>This is my passport</Btn>}
      </div>
    </div>
  );
}

// ── Profile builder ───────────────────────────────────────────────────────────

function ProfileBuilderScreen({ onComplete }: { onComplete: (values: ProfileValues) => void }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<ProfileValues>({
    cuisine: 5, distance: 5, budget: 5, risk: 5, language: 5, solitude: 5,
  });
  const [fading, setFading] = useState(false);

  const slide  = PROFILE_SLIDES[step];
  const isLast = step === PROFILE_SLIDES.length - 1;

  const next = () => {
    setFading(true);
    setTimeout(() => {
      if (isLast) { onComplete(values); return; }
      setStep(step + 1);
      setFading(false);
    }, 250);
  };

  return (
    <div style={{ ...WRAP, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ ...INNER, paddingTop: 40, paddingBottom: 40 }}>
        <div style={{ fontSize: '0.625rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: c.faint, marginBottom: 6 }}>Step 2 of 3 — Profile</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
          {PROFILE_SLIDES.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2, background: i <= step ? c.fg : c.ghost, transition: 'background 0.3s' }} />
          ))}
        </div>
        <div style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.25s' }}>
          <SliderInput
            value={values[slide.key]}
            onChange={v => setValues({ ...values, [slide.key]: v })}
            label={slide.label} desc={slide.desc} low={slide.low} high={slide.high} icon={slide.icon}
          />
        </div>
        <Btn onClick={next}>{isLast ? 'See my world' : 'Next'}</Btn>
      </div>
    </div>
  );
}

// ── Mobility reveal ───────────────────────────────────────────────────────────

function MobilityScreen({ passport, onContinue }: { passport: string; onContinue: () => void }) {
  const data = COUNTRIES_ACCESS[passport];
  const [anim, setAnim] = useState(false);
  useEffect(() => { setTimeout(() => setAnim(true), 400); }, []);

  return (
    <div style={{ ...WRAP, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ ...INNER, paddingTop: 40, paddingBottom: 40 }}>
        <div style={{ fontSize: '0.625rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: c.faint, marginBottom: 8 }}>
          Step 3 of 3 — {data.name} passport
        </div>
        <div style={{ fontSize: '4.75rem', opacity: anim ? 1 : 0, transition: 'opacity 1.2s', marginBottom: 0, lineHeight: 1 }}>
          {data.score}
        </div>
        <div style={{ fontSize: '0.875rem', color: c.faint, marginBottom: 28 }}>/ 100 mobility score</div>
        <div style={{ width: '100%', height: 2, background: c.ghost, marginBottom: 32, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: 2, width: anim ? `${data.score}%` : '0%', background: c.fg, transition: 'width 1.5s ease-out' }} />
        </div>

        {([
          ['Visa-free access', `${data.visaFree} countries`, c.fg],
          ['Restricted', `${data.restricted} countries`, c.dim],
          ['Effectively impossible', `${data.impossible} countries`, c.danger],
        ] as const).map(([l, v, col]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: `1px solid ${c.ghost}` }}>
            <span style={{ fontSize: '0.875rem', color: c.dim }}>{l}</span>
            <span style={{ fontSize: '0.875rem', color: col }}>{v}</span>
          </div>
        ))}

        <div style={{ fontSize: '0.875rem', color: c.faint, fontStyle: 'italic', marginTop: 28, marginBottom: 32, lineHeight: 1.7 }}>
          {data.score > 80
            ? 'Most of the world is open to you. That is not normal.'
            : data.score > 40
            ? 'About a third of the world is accessible. The rest requires patience or luck.'
            : 'Most borders are closed to you before you\'ve done anything wrong.'}
        </div>
        <Btn onClick={onContinue}>Start discovering</Btn>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  const _hasHydrated  = usePassageStore(s => s._hasHydrated);
  const storedPassport = usePassageStore(s => s.passport);
  const setPassport   = usePassageStore(s => s.setPassport);
  const setProfile    = usePassageStore(s => s.setProfile);

  const [screen, setScreen]           = useState<OnboardingScreen>('welcome');
  const [localPassport, setLocalPassport] = useState('');
  const [localProfile, setLocalProfile]   = useState<ProfileValues>({
    cuisine: 5, distance: 5, budget: 5, risk: 5, language: 5, solitude: 5,
  });
  const [trans, setTrans] = useState(false);

  useEffect(() => {
    if (_hasHydrated && storedPassport) router.replace('/discover');
  }, [_hasHydrated, storedPassport, router]);

  const go = (s: OnboardingScreen) => {
    setTrans(true);
    setTimeout(() => { setScreen(s); setTrans(false); }, 350);
  };

  const handleComplete = () => {
    setPassport(localPassport);
    setProfile(localProfile);
    router.push('/discover');
  };

  if (!_hasHydrated) return null;

  return (
    <div style={{ opacity: trans ? 0 : 1, transition: 'opacity 0.35s ease-out' }}>
      {screen === 'welcome'   && <WelcomeScreen onStart={() => go('passport')} />}
      {screen === 'passport'  && <PassportScreen onSelect={c => { setLocalPassport(c); go('profile'); }} />}
      {screen === 'profile'   && <ProfileBuilderScreen onComplete={v => { setLocalProfile(v); go('mobility'); }} />}
      {screen === 'mobility'  && localPassport && (
        <MobilityScreen passport={localPassport} onContinue={handleComplete} />
      )}
    </div>
  );
}
