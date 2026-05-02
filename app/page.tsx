'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingShell from '@/components/OnboardingShell';
import DotMatrix, { BIG_COMPASS_FRAMES, BIG_GLOBE_FRAMES } from '@/components/DotMatrix';
import Btn from '@/components/Btn';
import SliderInput from '@/components/SliderInput';
import SignInScreen from '@/components/SignInScreen';
import IdentityScreen from '@/components/IdentityScreen';
import AmpFormScreen from '@/components/AmpFormScreen';
import AmpRevealScreen from '@/components/AmpRevealScreen';
import { PROFILE_SLIDES } from '@/lib/data';
import { usePassageStore } from '@/lib/store';
import type { Identity, ProfileValues, User } from '@/lib/types';
import { defaultAmpProfile, type AmpProfile } from '@/lib/amp';

type Screen = 'welcome' | 'signin' | 'identity' | 'amp' | 'reveal' | 'preferences';

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVis(true), 200);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className={`transition-opacity duration-700 ${vis ? 'opacity-100' : 'opacity-0'}`}>
      <OnboardingShell
        art={<DotMatrix frames={BIG_GLOBE_FRAMES} intervalMs={300} dotSize={7} gap={4} />}
      >
        <div className="mb-3.5 text-[0.625rem] uppercase tracking-[0.3em] text-faint">passage</div>
        <div className="mb-[18px] text-4xl leading-[1.15]">
          The world isn&apos;t
          <br />
          the same size
          <br />
          for everyone.
        </div>
        <p className="mb-9 text-sm leading-[1.7] text-dim">
          See the places you can actually reach.
          <br />
          Build your AMP score to unlock faster approvals,
          <br />
          premium routes, and matching with travelers attempting
          <br />
          the same crossing from a different starting point.
        </p>
        <Btn onClick={onStart}>Begin</Btn>
      </OnboardingShell>
    </div>
  );
}

function PreferencesScreen({ onComplete }: { onComplete: (values: ProfileValues) => void }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<ProfileValues>({
    cuisine: 5,
    distance: 5,
    budget: 5,
    risk: 5,
    language: 5,
    solitude: 5,
  });
  const [fading, setFading] = useState(false);

  const slide = PROFILE_SLIDES[step];
  const isLast = step === PROFILE_SLIDES.length - 1;

  const next = () => {
    setFading(true);
    setTimeout(() => {
      if (isLast) {
        onComplete(values);
        return;
      }
      setStep(step + 1);
      setFading(false);
    }, 250);
  };

  return (
    <OnboardingShell
      step={`Step 4 — Travel preferences · ${step + 1} / ${PROFILE_SLIDES.length}`}
      art={<DotMatrix frames={BIG_COMPASS_FRAMES} intervalMs={360} dotSize={6} gap={4} />}
    >
      <div className="mb-8 flex gap-1">
        {PROFILE_SLIDES.map((_, i) => (
          <div
            key={i}
            className={`h-0.5 flex-1 transition-colors ${i <= step ? 'bg-fg' : 'bg-ghost'}`}
          />
        ))}
      </div>
      <div className="mb-2 text-2xl leading-tight">How you travel.</div>
      <p className="mb-7 text-sm leading-relaxed text-dim">
        Six quick sliders so we can match destinations to your style.
      </p>
      <div className={`transition-opacity duration-200 ${fading ? 'opacity-0' : 'opacity-100'}`}>
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

export default function OnboardingPage() {
  const router = useRouter();

  const _hasHydrated = usePassageStore(s => s._hasHydrated);
  const storedUser = usePassageStore(s => s.user);
  const storedAmpDone = usePassageStore(s => s.ampCompleted);
  const storedPassport = usePassageStore(s => s.passport);

  const setUser = usePassageStore(s => s.setUser);
  const setIdentity = usePassageStore(s => s.setIdentity);
  const setAmp = usePassageStore(s => s.setAmp);
  const setAmpCompleted = usePassageStore(s => s.setAmpCompleted);
  const setProfile = usePassageStore(s => s.setProfile);

  const [screen, setScreen] = useState<Screen>('welcome');
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [, setPendingIdentity] = useState<Identity | null>(null);
  const [pendingAmp, setPendingAmp] = useState<AmpProfile>(defaultAmpProfile());
  const [trans, setTrans] = useState(false);

  // If the user already finished onboarding, jump to /discover — but only on
  // the first hydration check. Once they're walking through the flow we don't
  // want this effect to re-fire and skip the rest of the screens.
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
    setTimeout(() => {
      setScreen(s);
      setTrans(false);
    }, 320);
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
    <div
      className={`transition-opacity duration-300 ease-out ${trans ? 'opacity-0' : 'opacity-100'}`}
    >
      {screen === 'welcome' && <WelcomeScreen onStart={() => go('signin')} />}
      {screen === 'signin' && <SignInScreen onComplete={handleSignIn} />}
      {screen === 'identity' && (
        <IdentityScreen initialName={pendingUser?.name ?? ''} onComplete={handleIdentity} />
      )}
      {screen === 'amp' && <AmpFormScreen initial={pendingAmp} onComplete={handleAmp} />}
      {screen === 'reveal' && <AmpRevealScreen profile={pendingAmp} onContinue={handleReveal} />}
      {screen === 'preferences' && <PreferencesScreen onComplete={handlePreferences} />}
    </div>
  );
}
