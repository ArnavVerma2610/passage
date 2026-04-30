'use client';

import { useRouter } from 'next/navigation';
import { c, MONO } from '@/lib/data';
import { usePassageStore } from '@/lib/store';
import { computeAmpScore, getTier, effectiveVisaProb } from '@/lib/amp';
import type { Destination } from '@/lib/types';

interface DestCardProps {
  dest: Destination;
  passport: string;
}

export default function DestCard({ dest, passport }: DestCardProps) {
  const router              = useRouter();
  const swipedDestinations  = usePassageStore(s => s.swipedDestinations);
  const addSwipedDestination   = usePassageStore(s => s.addSwipedDestination);
  const removeSwipedDestination = usePassageStore(s => s.removeSwipedDestination);

  const amp      = usePassageStore(s => s.amp);
  const tier     = getTier(computeAmpScore(amp));
  const baseProb = dest.visaProb[passport] || 50;
  const prob     = effectiveVisaProb(baseProb, tier);
  const saved    = swipedDestinations.some(e => e.id === dest.id && e.dir === 'right');

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) removeSwipedDestination(dest.id);
    else addSwipedDestination(dest.id, 'right');
  };

  const probColor = prob > 80 ? c.sub : prob > 50 ? '#cc9900' : '#cc4444';
  const probBorder = prob > 80 ? c.ghost : prob > 50 ? '#443300' : '#440000';

  return (
    <div
      onClick={() => router.push(`/trip/${dest.id}`)}
      style={{ cursor: 'pointer', borderBottom: `1px solid ${c.ghost}`, borderRight: `1px solid ${c.ghost}`, position: 'relative', background: 'transparent', transition: 'background 0.15s' }}
      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = '#050505')}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
    >
      {/* Save toggle */}
      <button
        onClick={toggleSave}
        title={saved ? 'Remove from trips' : 'Save to trips'}
        style={{
          position: 'absolute', top: 14, right: 14, zIndex: 2,
          background: saved ? c.fg : 'none',
          border: `1px solid ${saved ? c.fg : c.ghost}`,
          color: saved ? c.bg : c.faint,
          width: 26, height: 26, fontFamily: MONO, fontSize: '0.625rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        {saved ? '✓' : '+'}
      </button>

      <div style={{ padding: '20px 20px 18px' }}>
        {/* Coords */}
        <div style={{ fontSize: '0.5625rem', color: c.faint, letterSpacing: '0.14em', marginBottom: 10, fontFamily: MONO }}>
          {dest.coords}
        </div>

        {/* Name */}
        <div style={{ fontSize: '1.25rem', fontFamily: MONO, marginBottom: 3, paddingRight: 36, lineHeight: 1.2 }}>
          {dest.name}
        </div>
        <div style={{ fontSize: '0.8125rem', color: c.dim, marginBottom: 2 }}>{dest.country}</div>
        <div style={{ fontSize: '0.6875rem', color: c.faint, marginBottom: 16 }}>{dest.region}</div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
          <span style={{ padding: '3px 8px', fontSize: '0.5625rem', letterSpacing: '0.08em', border: `1px solid ${probBorder}`, color: probColor, fontFamily: MONO }}>
            {prob}% VISA
          </span>
          <span style={{ padding: '3px 8px', fontSize: '0.5625rem', letterSpacing: '0.06em', border: `1px solid ${c.ghost}`, color: c.faint, fontFamily: MONO }}>
            {dest.bestMonths}
          </span>
          <span style={{ padding: '3px 8px', fontSize: '0.5625rem', letterSpacing: '0.06em', border: `1px solid ${c.ghost}`, color: c.faint, fontFamily: MONO }}>
            FRICTION {dest.frictionLevel}
          </span>
        </div>

        {/* Voice note excerpt */}
        <div style={{ fontSize: '0.8125rem', color: c.dim, fontStyle: 'italic', lineHeight: 1.55, borderLeft: `2px solid ${c.ghost}`, paddingLeft: 12 }}>
          "{dest.voiceNote}"
        </div>
      </div>

      {/* Friction bar footer */}
      <div style={{ height: 2, background: c.ghost }}>
        <div style={{ height: 2, width: `${dest.frictionLevel}%`, background: c.faint }} />
      </div>
    </div>
  );
}
