'use client';

import { c, MONO } from '@/lib/data';

interface OnboardingShellProps {
  step?: string;
  art: React.ReactNode;
  children: React.ReactNode;
  artSide?: 'left' | 'right';
}

/**
 * Shared onboarding layout. Outer is `display: grid; place-items: center` against
 * `min-height: 100vh`, which dead-centers the inner two-column grid both horizontally
 * and vertically across the viewport on every screen.
 */
export default function OnboardingShell({ step, art, children, artSide = 'right' }: OnboardingShellProps) {
  return (
    <div
      style={{
        fontFamily: MONO,
        minHeight: '100vh',
        color: c.fg,
        background: c.bg,
        fontSize: '0.875rem',
        lineHeight: 1.6,
        letterSpacing: '-0.01em',
        display: 'grid',
        placeItems: 'center',
        padding: '32px 16px',
      }}
    >
      <div
        className="md:grid md:grid-cols-2 md:items-center md:gap-16"
        style={{
          display: 'grid',
          width: '100%',
          maxWidth: 1200,
          gridTemplateColumns: '1fr',
          rowGap: 32,
          alignItems: 'center',
        }}
      >
        {/* Copy column */}
        <div
          className={artSide === 'right' ? 'md:order-1' : 'md:order-2'}
          style={{
            padding: '0 16px',
            maxWidth: 560,
            width: '100%',
            margin: '0 auto',
          }}
        >
          {step && (
            <div
              style={{
                fontSize: '0.625rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: c.faint,
                marginBottom: 18,
              }}
            >
              {step}
            </div>
          )}
          {children}
        </div>

        {/* Art column — vertically centered against the copy column */}
        <div
          className={artSide === 'right' ? 'md:order-2' : 'md:order-1'}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0 16px',
          }}
        >
          {art}
        </div>
      </div>
    </div>
  );
}
