'use client';

import { useState } from 'react';
import OnboardingShell from './OnboardingShell';
import DotMatrix, { BIG_NETWORK_FRAMES } from './DotMatrix';
import Btn from './Btn';
import { c, MONO } from '@/lib/data';
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
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 18.9 13 24 13c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-1.9 1.3-4.4 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function AppleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="#fff">
      <path d="M16.36 0c.05.27.05.55.05.83 0 1.79-.66 3.5-1.74 4.62-.92 1-2.42 1.78-3.7 1.78-.07-.27-.07-.55-.07-.83 0-1.79.83-3.4 1.84-4.45 1.05-1.08 2.46-1.74 3.62-1.95zM21.4 17.4c-.4.92-.86 1.78-1.4 2.6-.81 1.18-1.96 2.66-3.39 2.67-1.27.01-1.6-.83-3.32-.82-1.71.01-2.07.84-3.34.83-1.43-.02-2.52-1.36-3.34-2.55C2.83 16.18 2.5 11.27 4.62 8.66c1.5-1.85 3.86-2.93 6.07-2.93 2.25 0 3.66.95 4.94.95 1.21 0 2.78-.95 5.06-.95 1.13 0 4.66.55 5.78 4.16-3.97 2.07-3.34 7.23-3.07 7.51z"/>
    </svg>
  );
}

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

  const startOauth = (provider: 'google' | 'apple') => {
    setPending(provider);
    // Demo OAuth: pretend to redirect, then come back with a derived identity.
    // In production this is replaced by NextAuth / Clerk + a real OAuth round-trip.
    setTimeout(() => {
      const fakeName  = provider === 'google' ? 'Traveler' : 'Traveler';
      const fakeEmail = `you@${provider}.com`;
      finish(provider, fakeName, fakeEmail);
    }, 1200);
  };

  const submitEmail = () => {
    if (!email.trim() || !name.trim()) return;
    setPending('email');
    setTimeout(() => finish('email', name.trim(), email.trim()), 600);
  };

  const oauthBtn: React.CSSProperties = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: '14px 16px', cursor: 'pointer',
    background: 'transparent', border: `1px solid ${c.ghost}`,
    color: c.fg, fontFamily: MONO, fontSize: '0.8125rem',
    letterSpacing: '0.04em', transition: 'border-color 0.15s, background 0.15s',
    marginBottom: 10,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: c.surface, border: `1px solid ${c.ghost}`,
    color: c.fg, fontFamily: MONO, fontSize: '0.875rem',
    padding: '13px 14px', outline: 'none', marginBottom: 10,
  };

  return (
    <OnboardingShell
      step="Step 1 — Sign in"
      art={<DotMatrix frames={BIG_NETWORK_FRAMES} intervalMs={320} dotSize={6} gap={4} />}
    >
      <div style={{ fontSize: '1.875rem', lineHeight: 1.15, marginBottom: 14 }}>
        Build your<br />mobility profile.
      </div>
      <div style={{ fontSize: '0.875rem', color: c.dim, lineHeight: 1.7, marginBottom: 36 }}>
        Sign in to save your AMP score, link your travel history,
        and resume from any device.
      </div>

      {pending ? (
        <div style={{ padding: '24px', border: `1px solid ${c.ghost}`, background: c.surface }}>
          <div style={{ fontSize: '0.625rem', color: c.faint, letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase' }}>
            Connecting to {pending}…
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c.fg, animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: '0.8125rem', color: c.dim }}>Verifying your identity</span>
          </div>
        </div>
      ) : !emailMode ? (
        <>
          <button
            onClick={() => startOauth('google')}
            style={oauthBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = c.fg; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = c.ghost; }}
          >
            <GoogleIcon /> Continue with Google
          </button>
          <button
            onClick={() => startOauth('apple')}
            style={oauthBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = c.fg; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = c.ghost; }}
          >
            <AppleIcon /> Continue with Apple
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: c.ghost }} />
            <span style={{ fontSize: '0.625rem', color: c.faint, letterSpacing: '0.18em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: c.ghost }} />
          </div>
          <button
            onClick={() => setEmailMode(true)}
            style={oauthBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = c.fg; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = c.ghost; }}
          >
            ✉ Continue with email
          </button>
          <div style={{ marginTop: 22, fontSize: '0.625rem', color: c.faint, lineHeight: 1.6 }}>
            By continuing you agree to share basic profile data with Passage.
            We never post on your behalf.
          </div>
        </>
      ) : (
        <>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            style={inputStyle}
          />
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            type="email"
            style={inputStyle}
          />
          <Btn onClick={submitEmail}>Continue</Btn>
          <button
            onClick={() => setEmailMode(false)}
            style={{
              background: 'none', border: 'none', color: c.faint,
              fontFamily: MONO, fontSize: '0.6875rem', letterSpacing: '0.1em',
              textTransform: 'uppercase', padding: '14px 0', cursor: 'pointer',
              width: '100%', marginTop: 4,
            }}
          >
            ← Back to providers
          </button>
        </>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </OnboardingShell>
  );
}
