'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SwipeCard from './SwipeCard';
import { DESTINATIONS } from '@/lib/data';
import { usePassageStore } from '@/lib/store';
import type { Destination } from '@/lib/types';

interface SwipeDeckProps {
  passport: string;
}

// Seeded Fisher-Yates shuffle so each `discoverRound` produces a stable but
// different ordering of the destinations.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let s = (seed * 9301 + 49297) % 233280;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function SwipeDeck({ passport }: SwipeDeckProps) {
  const router = useRouter();
  const swipedDestinations = usePassageStore(s => s.swipedDestinations);
  const discoverRound = usePassageStore(s => s.discoverRound);
  const addSwipedDestination = usePassageStore(s => s.addSwipedDestination);
  const clearSwipes = usePassageStore(s => s.clearSwipes);

  const queue: Destination[] = useMemo(() => {
    const swipedIds = new Set(swipedDestinations.map(s => s.id));
    const ordered = seededShuffle(DESTINATIONS, discoverRound + 1);
    return ordered.filter(d => !swipedIds.has(d.id));
  }, [swipedDestinations, discoverRound]);

  const top = queue[0];
  const next = queue[1];
  const after = queue[2];

  const savedCount = swipedDestinations.filter(s => s.dir === 'right').length;

  const handleSwipe = (dir: 'left' | 'right') => {
    if (!top) return;
    addSwipedDestination(top.id, dir);
  };

  if (queue.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 text-[0.625rem] uppercase tracking-[0.18em] text-faint">
          End of round {discoverRound + 1}
        </div>
        <div className="mb-2 text-base leading-snug text-fg">
          You&apos;ve seen every destination this round.
        </div>
        <div className="mb-7 max-w-[420px] text-[0.8125rem] leading-relaxed text-dim">
          {savedCount > 0
            ? `${savedCount} saved to your trips. Regenerate to shuffle the deck and surface them in a new order.`
            : 'Nothing saved this round. Regenerate the deck and try a slower second pass.'}
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          {savedCount > 0 && (
            <button
              type="button"
              onClick={() => router.push('/trips')}
              className="cursor-pointer border-0 bg-fg px-[22px] py-3 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-bg"
            >
              View trips ({savedCount})
            </button>
          )}
          <button
            type="button"
            onClick={() => clearSwipes()}
            className="cursor-pointer border border-fg bg-transparent px-[22px] py-3 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-fg"
          >
            ↻ Regenerate deck
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-[600px] max-w-[480px] py-6 pb-10 md:max-w-[760px] lg:max-w-[960px] xl:max-w-[1120px]">
      <div className="mb-3.5 text-center text-[0.5625rem] uppercase tracking-[0.18em] text-faint">
        round {discoverRound + 1} · {queue.length} left · {savedCount} saved
      </div>

      <div className="relative">
        {after && (
          <motion.div
            key={`bg2-${after.id}`}
            initial={{ scale: 0.92, y: 24, opacity: 0.4 }}
            animate={{ scale: 0.92, y: 24, opacity: 0.4 }}
            className="pointer-events-none absolute inset-0 origin-top border border-ghost bg-bg"
          />
        )}

        {next && (
          <motion.div
            key={`bg1-${next.id}`}
            initial={{ scale: 0.96, y: 12, opacity: 0.7 }}
            animate={{ scale: 0.96, y: 12, opacity: 0.7 }}
            className="pointer-events-none absolute inset-0 origin-top border border-ghost bg-bg"
          />
        )}

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={top.id}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="relative z-[2]"
          >
            <SwipeCard dest={top} passport={passport} onSwipe={handleSwipe} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-[18px] text-center text-[0.625rem] uppercase tracking-[0.12em] text-faint">
        ← skip · save →
      </div>
    </div>
  );
}
