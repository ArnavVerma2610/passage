'use client';

import { useState } from 'react';
import OnboardingShell from './OnboardingShell';
import DotMatrix, { BIG_NETWORK_FRAMES } from './DotMatrix';
import Btn from './Btn';
import type { AuthProvider, User } from '@/lib/types';

interface SignInScreenProps {
  onComplete: (user: User) => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '··';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 18.9 13 24 13c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-1.9 1.3-4.4 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function AppleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="#fff">
      <path d="M16.36 0c.05.27.05.55.05.83 0 1.79-.66 3.5-1.74 4.62-.92 1-2.42 1.78-3.7 1.78-.07-.27-.07-.55-.07-.83 0-1.79.83-3.4 1.84-4.45 1.05-1.08 2.46-1.74 3.62-1.95zM21.4 17.4c-.4.92-.86 1.78-1.4 2.6-.81 1.18-1.96 2.66-3.39 2.67-1.27.01-1.6-.83-3.32-.82-1.71.01-2.07.84-3.34.83-1.43-.02-2.52-1.36-3.34-2.55C2.83 16.18 2.5 11.27 4.62 8.66c1.5-1.85 3.86-2.93 6.07-2.93 2.25 0 3.66.95 4.94.95 1.21 0 2.78-.95 5.06-.95 1.13 0 4.66.55 5.78 4.16-3.97 2.07-3.34 7.23-3.07 7.51z" />
    </svg>
  );
}

const OAUTH_BTN =
  'mb-2.5 flex w-full cursor-pointer items-center justify-center gap-3 border border-ghost bg-transparent px-4 py-3.5 font-mono text-[0.8125rem] tracking-[0.04em] text-fg transition-colors hover:border-fg';

const INPUT =
  'mb-2.5 w-full border border-ghost bg-surface px-3.5 py-3 font-mono text-sm text-fg outline-none';

export default function SignInScreen({ onComplete }: SignInScreenProps) {
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [pending, setPending] = useState<AuthProvider | null>(null);

  const finish = (provider: AuthProvider, n: string, e: string) => {
    onComplete({
      name: n,
      email: e,
      provider,
      avatarInitials: initials(n),
      signedInAt: new Date().toISOString(),
    });
  };

  // Demo OAuth: pretend to redirect, then come back with a derived identity.
  // In production this is replaced by NextAuth / Clerk + a real OAuth round-trip.
  const startOauth = (provider: 'google' | 'apple') => {
    setPending(provider);
    setTimeout(() => finish(provider, 'Traveler', `you@${provider}.com`), 1200);
  };

  const submitEmail = () => {
    if (!email.trim() || !name.trim()) return;
    setPending('email');
    setTimeout(() => finish('email', name.trim(), email.trim()), 600);
  };

  return (
    <OnboardingShell
      step="Step 1 — Sign in"
      art={<DotMatrix frames={BIG_NETWORK_FRAMES} intervalMs={320} dotSize={6} gap={4} />}
    >
      <h1 className="mb-3.5 text-3xl leading-[1.15]">
        Build your
        <br />
        mobility profile.
      </h1>
      <p className="mb-9 text-sm leading-[1.7] text-dim">
        Sign in to save your AMP score, link your travel history, and resume from any device.
      </p>

      {pending ? (
        <div className="border border-ghost bg-surface p-6">
          <div className="mb-2.5 text-[0.625rem] uppercase tracking-[0.16em] text-faint">
            Connecting to {pending}…
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full bg-fg"
              style={{ animation: 'pulse-dot 1s infinite' }}
            />
            <span className="text-[0.8125rem] text-dim">Verifying your identity</span>
          </div>
        </div>
      ) : !emailMode ? (
        <>
          <button type="button" onClick={() => startOauth('google')} className={OAUTH_BTN}>
            <GoogleIcon /> Continue with Google
          </button>
          <button type="button" onClick={() => startOauth('apple')} className={OAUTH_BTN}>
            <AppleIcon /> Continue with Apple
          </button>
          <div className="my-4 flex items-center gap-2.5">
            <div className="h-px flex-1 bg-ghost" />
            <span className="text-[0.625rem] tracking-[0.18em] text-faint">OR</span>
            <div className="h-px flex-1 bg-ghost" />
          </div>
          <button type="button" onClick={() => setEmailMode(true)} className={OAUTH_BTN}>
            ✉ Continue with email
          </button>
          <p className="mt-5 text-[0.625rem] leading-relaxed text-faint">
            By continuing you agree to share basic profile data with Passage. We never post on your
            behalf.
          </p>
        </>
      ) : (
        <>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className={INPUT}
          />
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            type="email"
            className={INPUT}
          />
          <Btn onClick={submitEmail}>Continue</Btn>
          <button
            type="button"
            onClick={() => setEmailMode(false)}
            className="mt-1 w-full cursor-pointer border-0 bg-transparent py-3.5 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-faint"
          >
            ← Back to providers
          </button>
        </>
      )}
    </OnboardingShell>
  );
}
