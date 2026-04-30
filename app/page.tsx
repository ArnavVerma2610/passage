'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingShell from '@/components/OnboardingShell';
import DotMatrix, { BIG_GLOBE_FRAMES, BIG_COMPASS_FRAMES } from '@/components/DotMatrix';
import Btn from '@/components/Btn';
import SliderInput from '@/components/SliderInput';
import SignInScreen from '@/components/SignInScreen';
import IdentityScreen from '@/components/IdentityScreen';
import AmpFormScreen from '@/components/AmpFormScreen';
import AmpRevealScreen from '@/components/AmpRevealScreen';
import { c, MONO, PROFILE_SLIDES } from '@/lib/data';
import { usePassageStore } from '@/lib/store';
import type { ProfileValues, User, Identity } from '@/lib/types';
import type { AmpProfile } from '@/lib/amp';
import { defaultAmpProfile } from '@/lib/amp';

type Screen = 'welcome' | 'signin' | 'identity' | 'amp' | 'reveal' | 'preferences';

// ── Welcome ───────────────────────────────────────────────────────────────────

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 200); }, []);
  return (
    <div style={{ opacity: vis ? 1 : 0, transition: 'opacity 0.9s' }}>
      <OnboardingShell
        art={<DotMatrix frames={BIG_GLOBE_FRAMES} intervalMs={300} dotSize={7} gap={4} />}
      >
        <div style={{ fontSize: '0.625rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: c.faint, marginBottom: 14 }}>
          passage
        </div>
        <div style={{ fontSize: '2.25rem', lineHeight: 1.15, marginBottom: 18 }}>
          The world isn't<br />the same size<br />for everyone.
        </div>
        <div style={{ fontSize: '0.875rem', color: c.dim, lineHeight: 1.7, marginBottom: 36 }}>
          See the places you can actually reach.<br />
          Build your AMP score to unlock faster approvals,<br />
          premium routes, and matching with travelers attempting<br />
          the same crossing from a different starting point.
        </div>
        <Btn onClick={onStart}>Begin</Btn>
      </OnboardingShell>
    </div>
  );
}

// ── Travel preferences ──────────────────────────────────────────────────────

function PreferencesScreen({ onComplete }: { onComplete: (values: ProfileValues) => void }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<ProfileValues>({
    cuisine: 5, distance: 5, budget: 5, risk: 5, language: 5, solitude: 5,
  });
  const [fading, setFading] = useState(false);

  const slide = PROFILE_SLIDES[step];
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
    <OnboardingShell
      step={`Step 4 — Travel preferences · ${step + 1} / ${PROFILE_SLIDES.length}`}
      art={<DotMatrix frames={BIG_COMPASS_FRAMES} intervalMs={360} dotSize={6} gap={4} />}
    >
      <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
        {PROFILE_SLIDES.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2, background: i <= step ? c.fg : c.ghost, transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ fontSize: '1.5rem', lineHeight: 1.2, marginBottom: 8 }}>
        How you travel.
      </div>
      <div style={{ fontSize: '0.875rem', color: c.dim, lineHeight: 1.6, marginBottom: 28 }}>
        Six quick sliders so we can match destinations to your style.
      </div>
      <div style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.25s' }}>
        <SliderInput
          value={values[slide.key]}
          onChange={v => setValues({ ...values, [slide.key]: v })}
          label={slide.label}
          desc={slide.desc}
          low={slide.low}
          high={slide.high}
          icon={slide.icon}
        />
      </div>
      <Btn onClick={next}>{isLast ? 'See my world' : 'Next'}</Btn>
    </OnboardingShell>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  const _hasHydrated  = usePassageStore(s => s._hasHydrated);
  const storedUser     = usePassageStore(s => s.user);
  const storedAmpDone  = usePassageStore(s => s.ampCompleted);
  const storedPassport = usePassageStore(s => s.passport);

  const setUser           = usePassageStore(s => s.setUser);
  const setIdentity       = usePassageStore(s => s.setIdentity);
  const setAmp            = usePassageStore(s => s.setAmp);
  const setAmpCompleted   = usePassageStore(s => s.setAmpCompleted);
  const setProfile        = usePassageStore(s => s.setProfile);

  const [screen, setScreen]     = useState<Screen>('welcome');
  const [pendingUser, setPendingUser]         = useState<User | null>(null);
  const [pendingIdentity, setPendingIdentity] = useState<Identity | null>(null);
  const [pendingAmp, setPendingAmp]           = useState<AmpProfile>(defaultAmpProfile());
  const [trans, setTrans] = useState(false);

  // If user already finished onboarding, jump straight to /discover —
  // but only on the FIRST hydration check. Once the user is walking through
  // the flow and completes a step (e.g. AMP), we don't want this effect
  // to re-fire and skip the rest of the screens.
  const initialCheckRef = useRef(false);
  useEffect(() => {
    if (!_hasHydrated || initialCheckRef.current) return;
    initialCheckRef.current = true;
    if (storedUser && storedPassport && storedAmpDone) {
      router.replace('/discover');
    }
  }, [_hasHydrated, storedUser, storedPassport, storedAmpDone, router]);

  const go = (s: Screen) => {
    setTrans(true);
    setTimeout(() => { setScreen(s); setTrans(false); }, 320);
  };

  if (!_hasHydrated) return null;

  const handleSignIn = (user: User) => {
    setUser(user);
    setPendingUser(user);
    go('identity');
  };

  const handleIdentity = (identity: Identity) => {
    setIdentity(identity);
    setPendingIdentity(identity);
    go('amp');
  };

  const handleAmp = (amp: AmpProfile) => {
    setAmp(amp);
    setPendingAmp(amp);
    go('reveal');
  };

  const handleReveal = () => {
    setAmpCompleted(true);
    go('preferences');
  };

  const handlePreferences = (values: ProfileValues) => {
    setProfile(values);
    router.push('/discover');
  };

  return (
    <div style={{ opacity: trans ? 0 : 1, transition: 'opacity 0.32s ease-out' }}>
      {screen === 'welcome'     && <WelcomeScreen onStart={() => go('signin')} />}
      {screen === 'signin'      && <SignInScreen onComplete={handleSignIn} />}
      {screen === 'identity'    && <IdentityScreen initialName={pendingUser?.name ?? ''} onComplete={handleIdentity} />}
      {screen === 'amp'         && <AmpFormScreen initial={pendingAmp} onComplete={handleAmp} />}
      {screen === 'reveal'      && <AmpRevealScreen profile={pendingAmp} onContinue={handleReveal} />}
      {screen === 'preferences' && <PreferencesScreen onComplete={handlePreferences} />}
    </div>
  );
}
