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
 *   - Desktop (≥ md): two-column grid; copy on one side, dot-matrix art on the other,
 *     both vertically centered against the full viewport.
 *   - Mobile (< md): art collapses above the copy, the whole stack is vertically centered.
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
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div
        className="md:grid md:grid-cols-2 md:items-center md:gap-10"
        style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* Mobile-only art block (smaller) */}
        <div
          className="md:hidden"
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '24px 24px 8px',
          }}
        >
          <div style={{ transform: 'scale(0.7)', transformOrigin: 'center center' }}>{art}</div>
        </div>

        {/* Copy column — centered both vertically (in the grid cell) and horizontally */}
        <div
          className={artSide === 'right' ? 'md:order-1' : 'md:order-2'}
          style={{
            padding: '24px 28px',
            maxWidth: 560,
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
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

        {/* Desktop-only art column (large, centered) */}
        <div
          className={`hidden md:flex md:items-center md:justify-center ${artSide === 'right' ? 'md:order-2' : 'md:order-1'}`}
          style={{ padding: '40px' }}
        >
          {art}
        </div>
      </div>
    </div>
  );
}
