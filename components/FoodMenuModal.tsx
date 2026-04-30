'use client';

import { useEffect } from 'react';
import { c, MONO } from '@/lib/data';
import type { FoodSpot } from '@/lib/types';

interface FoodMenuModalProps {
  spot: FoodSpot;
  onClose: () => void;
}

export function priceDollars(level: 1 | 2 | 3 | 4) {
  return '$'.repeat(level);
}

export default function FoodMenuModal({ spot, onClose }: FoodMenuModalProps) {
  // close on Esc, lock body scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 250,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        fontFamily: MONO,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto',
          background: c.bg, border: `1px solid ${c.ghost}`,
          padding: '28px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.5625rem', letterSpacing: '0.14em', color: c.faint, marginBottom: 6, textTransform: 'uppercase' }}>{spot.type}</div>
            <div style={{ fontSize: '1.375rem', color: c.fg, lineHeight: 1.2 }}>{spot.name}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none', border: `1px solid ${c.ghost}`, color: c.faint,
              fontFamily: MONO, fontSize: '0.875rem', cursor: 'pointer',
              width: 32, height: 32, flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          <span style={{ padding: '4px 10px', fontSize: '0.625rem', border: `1px solid ${c.ghost}`, color: c.fg, letterSpacing: '0.08em' }}>
            {priceDollars(spot.priceLevel)}
          </span>
          <span style={{ padding: '4px 10px', fontSize: '0.625rem', border: `1px solid ${c.ghost}`, color: c.faint, letterSpacing: '0.05em' }}>
            📍 {spot.map}
          </span>
        </div>

        {/* Description */}
        <div style={{ fontSize: '0.875rem', color: c.dim, lineHeight: 1.65, marginBottom: 14 }}>
          {spot.desc}
        </div>

        {/* Fun fact */}
        <div style={{
          padding: '12px 14px',
          background: c.surface,
          borderLeft: `2px solid ${c.fg}`,
          fontSize: '0.8125rem',
          color: c.sub,
          lineHeight: 1.6,
          fontStyle: 'italic',
          marginBottom: 18,
        }}>
          Fun fact — {spot.funFact}
        </div>

        {/* Submitted by */}
        <div style={{ fontSize: '0.6875rem', color: c.faint, marginBottom: 22 }}>
          submitted by <span style={{ color: c.dim }}>{spot.submittedBy}</span>
        </div>

        {/* Menu */}
        <div style={{ fontSize: '0.5625rem', letterSpacing: '0.18em', color: c.faint, marginBottom: 12, textTransform: 'uppercase' }}>Menu</div>
        <div style={{ borderTop: `1px solid ${c.ghost}` }}>
          {spot.menu.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, padding: '14px 0', borderBottom: `1px solid ${c.ghost}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', color: c.fg, marginBottom: 3 }}>{item.name}</div>
                <div style={{ fontSize: '0.75rem', color: c.dim, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
              <div style={{ fontSize: '0.8125rem', color: c.sub, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {item.price}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
