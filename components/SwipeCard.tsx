'use client';

import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { usePassageStore } from '@/lib/store';
import { computeAmpScore, effectiveVisaProb, getTier, TIER_META } from '@/lib/amp';
import type { Destination } from '@/lib/types';

const DIST_THRESHOLD = 100;
const VEL_THRESHOLD = 500;

const EXIT_SPRING = { type: 'spring', stiffness: 380, damping: 34, restDelta: 0.5 } as const;
const SNAP_SPRING = { type: 'spring', stiffness: 520, damping: 38 } as const;

interface SwipeCardProps {
  dest: Destination;
  passport: string;
  onSwipe: (dir: 'left' | 'right') => void;
}

export default function SwipeCard({ dest, passport, onSwipe }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-320, 320], [-18, 18]);
  const leftOpacity = useTransform(x, [-110, -40], [1, 0]);
  const rightOpacity = useTransform(x, [40, 110], [0, 1]);

  const baseProb = dest.visaProb[passport] || 50;
  const amp = usePassageStore(s => s.amp);
  const tier = getTier(computeAmpScore(amp));
  const meta = TIER_META[tier];
  const prob = effectiveVisaProb(baseProb, tier);

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
      void animate(x, 0, SNAP_SPRING);
    }
  };

  // Visa probability gets one of three theme-aware colour bands.
  const probClass =
    prob > 80
      ? 'border-success-border text-success'
      : prob > 50
        ? 'border-warn-border text-warn'
        : 'border-danger-border text-danger';

  return (
    <div className="relative px-4">
      <motion.div
        className="pointer-events-none absolute left-7 top-5 z-10 text-xs tracking-[0.1em] text-danger"
        style={{ opacity: leftOpacity }}
      >
        NOT NOW
      </motion.div>
      <motion.div
        className="pointer-events-none absolute right-7 top-5 z-10 text-xs tracking-[0.1em] text-success"
        style={{ opacity: rightOpacity }}
      >
        INTERESTED
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        whileDrag={{ cursor: 'grabbing' }}
        onDragEnd={handleDragEnd}
        className="relative z-[1] touch-pan-y select-none border border-ghost"
        style={{ x, rotate }}
      >
        <div className="px-6 pt-6">
          <div className="mb-2 text-[10px] tracking-[0.15em] text-faint">{dest.coords}</div>
          <div className="mb-0.5 font-mono text-3xl">{dest.name}</div>
          <div className="mb-1 text-[13px] text-dim">{dest.country}</div>
          <div className="mb-4 text-[11px] text-faint">{dest.region}</div>
          <div className="mb-5 flex flex-wrap gap-2">
            <span className={`border px-2.5 py-[5px] text-[10px] tracking-[0.08em] ${probClass}`}>
              {prob}% VISA PROB
            </span>
            <span
              className="border px-2.5 py-[5px] text-[10px] tracking-[0.08em]"
              style={{ borderColor: meta.color, color: meta.color }}
            >
              {meta.short}
            </span>
            <span className="border border-ghost px-2.5 py-[5px] text-[10px] tracking-[0.08em] text-faint">
              {dest.bestMonths}
            </span>
            <span className="border border-ghost px-2.5 py-[5px] text-[10px] tracking-[0.08em] text-faint">
              FRICTION {dest.frictionLevel}/100
            </span>
          </div>
        </div>

        <div className="px-6 lg:grid lg:grid-cols-2 lg:gap-x-8">
          <div className="mb-5">
            <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-faint">
              Someone who lives here
            </div>
            <div className="border-l-2 border-ghost bg-surface px-4 py-3.5">
              <div className="mb-2.5 flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-faint text-[8px] text-faint">
                  ▶
                </div>
                <div className="relative h-px flex-1 bg-ghost">
                  <div className="absolute -top-0.5 left-0 h-1.5 w-1.5 rounded-full bg-faint" />
                </div>
                <span className="text-[10px] text-faint">{dest.voiceDuration}</span>
              </div>
              <div className="text-[13px] italic leading-snug text-dim">
                &ldquo;{dest.voiceNote}&rdquo;
              </div>
            </div>
          </div>

          <div className="mb-5">
            <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-faint">
              This place asks you
            </div>
            {dest.prompts.map((p, i) => (
              <div key={i} className="border-b border-ghost py-3 text-[13px] leading-snug text-sub">
                {p}
              </div>
            ))}
          </div>

          <div className="mb-5">
            <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-faint">
              Hidden spots — {dest.foodSpots.length} unlocked on arrival
            </div>
            <div className="bg-surface px-4 py-3.5">
              <div className="mb-1.5 text-[13px] leading-snug text-dim">
                {dest.foodSpots[0].desc}
              </div>
              <div className="text-[10px] italic text-faint">
                + {dest.foodSpots.length - 1} more spots revealed when you commit
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="relative mb-3 h-0.5 w-full bg-ghost">
              <div
                className="absolute left-0 top-0 h-0.5 bg-fg"
                style={{ width: `${dest.frictionLevel}%` }}
              />
            </div>
            {Object.entries(dest.friction).map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 text-xs">
                <span className="capitalize text-faint">{k}</span>
                <span className="max-w-[65%] text-right text-dim">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-2 px-6 py-3.5 text-[13px] leading-snug text-dim">
          {dest.trivia}
        </div>

        {dest.deniedCount > 0 && (
          <div className="flex justify-between border-t border-ghost px-6 py-3.5">
            <span className="text-xs text-danger">
              {dest.deniedCount} people were denied entry here
            </span>
            <span className="cursor-pointer text-[10px] text-faint underline underline-offset-[3px]">
              read
            </span>
          </div>
        )}
      </motion.div>

      <div className="flex justify-center gap-5 py-5">
        <button
          type="button"
          onClick={() => void triggerExit('left')}
          className="flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-full border border-faint bg-transparent text-lg text-dim"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={() => void triggerExit('right')}
          className="flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-full border border-fg bg-transparent text-lg text-fg"
        >
          →
        </button>
      </div>
    </div>
  );
}
