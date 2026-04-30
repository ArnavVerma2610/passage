'use client';

import { c, MONO } from '@/lib/data';

interface OnboardingShellProps {
  step?: string;
  art: React.ReactNode;
  children: React.ReactNode;
  artSide?: 'left' | 'right';
}

/**
 * Shared onboarding layout.
 * Mobile  : single flex column, full-viewport, content vertically centered.
 * Desktop : two-column grid, EACH column is min-h-screen and self-centers
 *           its content with `flex flex-col justify-center`. This guarantees
 *           both the copy column and the art column visually center against
 *           the full viewport height regardless of either side's content size.
 */
export default function OnboardingShell({ step, art, children, artSide = 'right' }: OnboardingShellProps) {
  return (
    <div
      style={{
        background: c.bg,
        color: c.fg,
        fontFamily: MONO,
        fontSize: '0.875rem',
        lineHeight: 1.6,
        letterSpacing: '-0.01em',
      }}
    >
      {/* Mobile wrapper centers the whole stack; on md it gets out of the way. */}
      <div className="min-h-screen flex flex-col justify-center md:block">
        <div className="md:grid md:grid-cols-2 md:gap-12">
          {/* Copy column (always rendered first in DOM for screen readers; visual order set per artSide on md) */}
          <div
            className={`flex flex-col justify-center md:min-h-screen ${artSide === 'right' ? 'md:order-1' : 'md:order-2'}`}
            style={{ padding: '32px 28px' }}
          >
            <div style={{ maxWidth: 560, width: '100%', margin: '0 auto' }}>
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
          </div>

          {/* Art column */}
          <div
            className={`flex items-center justify-center md:min-h-screen ${artSide === 'right' ? 'md:order-2' : 'md:order-1'}`}
            style={{ padding: '24px' }}
          >
            {art}
          </div>
        </div>
      </div>
    </div>
  );
}
