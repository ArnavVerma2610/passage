'use client';

import { c, MONO } from '@/lib/data';

interface OnboardingShellProps {
  step?: string;
  art: React.ReactNode;
  children: React.ReactNode;
  artSide?: 'left' | 'right';
}

/**
 * Shared onboarding layout:
 *   - Desktop (≥ md): two-column grid; copy on one side, dot-matrix art on the other.
 *   - Mobile (< md): art collapses to a smaller block above the copy.
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
      }}
    >
      <div className="md:grid md:grid-cols-2 md:items-center md:min-h-screen md:gap-10">
        {/* Mobile-only art block (smaller) */}
        <div
          className="md:hidden"
          style={{ display: 'flex', justifyContent: 'center', padding: '40px 24px 0' }}
        >
          <div style={{ transform: 'scale(0.7)', transformOrigin: 'center top' }}>{art}</div>
        </div>

        {/* Copy column */}
        <div
          className={artSide === 'right' ? 'md:order-1' : 'md:order-2'}
          style={{ padding: '32px 28px 64px', maxWidth: 560, width: '100%', margin: '0 auto' }}
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

        {/* Desktop-only art column (large, full block) */}
        <div
          className={`hidden md:flex md:items-center md:justify-center ${artSide === 'right' ? 'md:order-2' : 'md:order-1'}`}
          style={{ padding: '40px', minHeight: '60vh' }}
        >
          {art}
        </div>
      </div>
    </div>
  );
}
