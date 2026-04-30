'use client';

import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'framer-motion';
import { c, MONO } from '@/lib/data';
import type { Destination } from '@/lib/types';

const DIST_THRESHOLD = 100; // px — gesture offset to trigger swipe
const VEL_THRESHOLD  = 500; // px/s — velocity to trigger swipe

// Spring configs
const EXIT_SPRING  = { type: 'spring', stiffness: 380, damping: 34, restDelta: 0.5 } as const;
const SNAP_SPRING  = { type: 'spring', stiffness: 520, damping: 38 } as const;

interface SwipeCardProps {
  dest: Destination;
  passport: string;
  onSwipe: (dir: 'left' | 'right') => void;
}

export default function SwipeCard({ dest, passport, onSwipe }: SwipeCardProps) {
  const x      = useMotionValue(0);
  const rotate = useTransform(x, [-320, 320], [-18, 18]);

  // Indicator labels fade in as the card is dragged past 40 px
  const leftOpacity  = useTransform(x, [-110, -40], [1, 0]);
  const rightOpacity = useTransform(x, [40, 110], [0, 1]);

  const prob = dest.visaProb[passport] || 50;

  // ── exit animation ────────────────────────────────────────────────────────
  const triggerExit = async (dir: 'left' | 'right') => {
    await animate(x, dir === 'right' ? 640 : -640, EXIT_SPRING);
    onSwipe(dir);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.x < -DIST_THRESHOLD || velocity.x < -VEL_THRESHOLD) {
      void triggerExit('left');
    } else if (offset.x > DIST_THRESHOLD || velocity.x > VEL_THRESHOLD) {
      void triggerExit('right');
    } else {
      // snap back to centre with a tight spring
      void animate(x, 0, SNAP_SPRING);
    }
  };

  return (
    <div style={{ padding: '0 16px', position: 'relative' }}>

      {/* ── directional labels ──────────────────────────────────────────── */}
      <motion.div
        style={{
          position: 'absolute', top: 20, left: 28, zIndex: 10,
          fontSize: 12, letterSpacing: '0.1em', color: c.danger,
          opacity: leftOpacity, pointerEvents: 'none',
        }}
      >
        NOT NOW
      </motion.div>
      <motion.div
        style={{
          position: 'absolute', top: 20, right: 28, zIndex: 10,
          fontSize: 12, letterSpacing: '0.1em', color: '#558855',
          opacity: rightOpacity, pointerEvents: 'none',
        }}
      >
        INTERESTED
      </motion.div>

      {/* ── draggable card ──────────────────────────────────────────────── */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        style={{ x, rotate, position: 'relative', zIndex: 1, border: `1px solid ${c.ghost}`, userSelect: 'none', touchAction: 'pan-y' }}
        whileDrag={{ cursor: 'grabbing' }}
        onDragEnd={handleDragEnd}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ fontSize: 10, color: c.faint, letterSpacing: '0.15em', marginBottom: 8 }}>{dest.coords}</div>
          <div style={{ fontSize: 32, fontFamily: MONO, marginBottom: 2 }}>{dest.name}</div>
          <div style={{ fontSize: 13, color: c.dim, marginBottom: 4 }}>{dest.country}</div>
          <div style={{ fontSize: 11, color: c.faint, marginBottom: 16 }}>{dest.region}</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ padding: '5px 10px', fontSize: 10, letterSpacing: '0.08em', border: `1px solid ${prob > 80 ? c.faint : prob > 50 ? '#553300' : '#550000'}`, color: prob > 80 ? c.sub : prob > 50 ? '#aa7700' : '#aa0000' }}>
              {prob}% VISA PROB
            </span>
            <span style={{ padding: '5px 10px', fontSize: 10, letterSpacing: '0.08em', border: `1px solid ${c.ghost}`, color: c.faint }}>
              {dest.bestMonths}
            </span>
            <span style={{ padding: '5px 10px', fontSize: 10, letterSpacing: '0.08em', border: `1px solid ${c.ghost}`, color: c.faint }}>
              FRICTION {dest.frictionLevel}/100
            </span>
          </div>
        </div>

        {/* Voice note */}
        <div style={{ padding: '0 24px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', color: c.faint, marginBottom: 8, textTransform: 'uppercase' }}>Someone who lives here</div>
          <div style={{ background: c.surface, padding: '14px 16px', borderLeft: `2px solid ${c.ghost}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${c.faint}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: c.faint }}>▶</div>
              <div style={{ flex: 1, height: 1, background: c.ghost, position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: -2, width: 6, height: 6, borderRadius: '50%', background: c.faint }} />
              </div>
              <span style={{ fontSize: 10, color: c.faint }}>{dest.voiceDuration}</span>
            </div>
            <div style={{ fontSize: 13, color: c.dim, fontStyle: 'italic', lineHeight: 1.5 }}>"{dest.voiceNote}"</div>
          </div>
        </div>

        {/* Prompts */}
        <div style={{ padding: '0 24px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', color: c.faint, marginBottom: 8, textTransform: 'uppercase' }}>This place asks you</div>
          {dest.prompts.map((p, i) => (
            <div key={i} style={{ padding: '12px 0', borderBottom: `1px solid ${c.ghost}`, fontSize: 13, color: c.sub, lineHeight: 1.5 }}>{p}</div>
          ))}
        </div>

        {/* Food preview */}
        <div style={{ padding: '0 24px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', color: c.faint, marginBottom: 8, textTransform: 'uppercase' }}>
            Hidden spots — {dest.foodSpots.length} unlocked on arrival
          </div>
          <div style={{ background: c.surface, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, color: c.dim, lineHeight: 1.5, marginBottom: 6 }}>{dest.foodSpots[0].desc}</div>
            <div style={{ fontSize: 10, color: c.faint, fontStyle: 'italic' }}>+ {dest.foodSpots.length - 1} more spots revealed when you commit</div>
          </div>
        </div>

        {/* Friction */}
        <div style={{ padding: '0 24px', marginBottom: 16 }}>
          <div style={{ width: '100%', height: 2, background: c.ghost, marginBottom: 12, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: 2, width: `${dest.frictionLevel}%`, background: c.fg }} />
          </div>
          {Object.entries(dest.friction).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
              <span style={{ color: c.faint, textTransform: 'capitalize' }}>{k}</span>
              <span style={{ color: c.dim, textAlign: 'right', maxWidth: '65%' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Trivia */}
        <div style={{ padding: '14px 24px', background: '#050505', fontSize: 13, color: c.dim, lineHeight: 1.5 }}>
          {dest.trivia}
        </div>

        {/* Denied */}
        {dest.deniedCount > 0 && (
          <div style={{ padding: '14px 24px', borderTop: `1px solid ${c.ghost}`, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: c.danger }}>{dest.deniedCount} people were denied entry here</span>
            <span style={{ fontSize: 10, color: c.faint, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}>read</span>
          </div>
        )}
      </motion.div>

      {/* ── action buttons ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, padding: '20px 0' }}>
        <button
          onClick={() => void triggerExit('left')}
          style={{ width: 52, height: 52, borderRadius: '50%', border: `1px solid ${c.faint}`, background: 'none', color: c.dim, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >✕</button>
        <button
          onClick={() => void triggerExit('right')}
          style={{ width: 52, height: 52, borderRadius: '50%', border: '1px solid #fff', background: 'none', color: c.fg, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >→</button>
      </div>
    </div>
  );
}
