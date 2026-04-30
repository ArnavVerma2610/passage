'use client';

import { c, MONO } from '@/lib/data';
import type { CSSProperties } from 'react';

interface BtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  style?: CSSProperties;
}

export default function Btn({ children, onClick, variant = 'primary', style: sx = {} }: BtnProps) {
  const base: CSSProperties = {
    fontFamily: MONO, fontSize: '0.75rem', letterSpacing: '0.08em', cursor: 'pointer',
    textTransform: 'uppercase', padding: '15px 0', width: '100%', border: 'none',
    transition: 'opacity 0.2s', marginTop: 8, ...sx,
  };
  if (variant === 'primary')
    return <button onClick={onClick} style={{ ...base, background: c.fg, color: c.bg }}>{children}</button>;
  if (variant === 'outline')
    return <button onClick={onClick} style={{ ...base, background: 'transparent', color: c.fg, border: `1px solid ${c.faint}` }}>{children}</button>;
  return <button onClick={onClick} style={{ ...base, background: 'transparent', color: c.dim, border: 'none', padding: '10px 0' }}>{children}</button>;
}
