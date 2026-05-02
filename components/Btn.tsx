'use client';

import type { CSSProperties, ReactNode } from 'react';

interface BtnProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  style?: CSSProperties;
  className?: string;
}

const VARIANTS: Record<NonNullable<BtnProps['variant']>, string> = {
  primary: 'bg-fg text-bg',
  outline: 'bg-transparent text-fg border border-faint',
  ghost: 'bg-transparent text-dim border-0 py-2.5',
};

export default function Btn({
  children,
  onClick,
  variant = 'primary',
  style,
  className = '',
}: BtnProps) {
  const base =
    'w-full font-mono text-xs uppercase tracking-[0.08em] cursor-pointer transition-opacity mt-2 py-[15px] border-0';

  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={`${base} ${VARIANTS[variant]} ${className}`.trim()}
    >
      {children}
    </button>
  );
}
