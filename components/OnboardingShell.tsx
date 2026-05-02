'use client';

import type { ReactNode } from 'react';

interface OnboardingShellProps {
  step?: string;
  art: ReactNode;
  children: ReactNode;
  artSide?: 'left' | 'right';
}

/**
 * Shared onboarding layout. Stacks vertically on mobile; on md+ becomes a
 * two-column grid where each column self-centers against the full viewport
 * height regardless of the other side's content size.
 */
export default function OnboardingShell({
  step,
  art,
  children,
  artSide = 'right',
}: OnboardingShellProps) {
  return (
    <div className="bg-bg font-mono text-sm leading-relaxed tracking-tight text-fg">
      <div className="flex min-h-screen flex-col justify-center md:block">
        <div className="md:grid md:grid-cols-2 md:gap-12">
          <div
            className={`flex flex-col justify-center px-7 py-8 md:min-h-screen ${
              artSide === 'right' ? 'md:order-1' : 'md:order-2'
            }`}
          >
            <div className="mx-auto w-full max-w-[560px]">
              {step && (
                <div className="mb-[18px] text-[0.625rem] uppercase tracking-[0.25em] text-faint">
                  {step}
                </div>
              )}
              {children}
            </div>
          </div>

          <div
            className={`flex items-center justify-center p-6 md:min-h-screen ${
              artSide === 'right' ? 'md:order-2' : 'md:order-1'
            }`}
          >
            {art}
          </div>
        </div>
      </div>
    </div>
  );
}
