'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SwipeCard from './SwipeCard';
import { c, MONO, DESTINATIONS } from '@/lib/data';
import { usePassageStore } from '@/lib/store';
import type { Destination } from '@/lib/types';

interface SwipeDeckProps {
  passport: string;
}

// Seeded Fisher-Yates shuffle so each `discoverRound` produces a stable but
// different ordering of the destinations. Pure function => same input, same output.
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
  const swipedDestinations    = usePassageStore(s => s.swipedDestinations);
  const discoverRound         = usePassageStore(s => s.discoverRound);
  const addSwipedDestination  = usePassageStore(s => s.addSwipedDestination);
  const clearSwipes           = usePassageStore(s => s.clearSwipes);

  // Build the queue: skip everything already swiped this round, then shuffle
  // by the round counter so each reset reshuffles the whole deck.
  const queue: Destination[] = useMemo(() => {
    const swipedIds = new Set(swipedDestinations.map(s => s.id));
    const ordered = seededShuffle(DESTINATIONS, discoverRound + 1);
    return ordered.filter(d => !swipedIds.has(d.id));
  }, [swipedDestinations, discoverRound]);

  const top    = queue[0];
  const next   = queue[1];
  const after  = queue[2];

  const savedCount = swipedDestinations.filter(s => s.dir === 'right').length;

  const handleSwipe = (dir: 'left' | 'right') => {
    if (!top) return;
    addSwipedDestination(top.id, dir);
  };

  if (queue.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.625rem', color: c.faint, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>End of round {discoverRound + 1}</div>
        <div style={{ fontSize: '1rem', color: c.fg, marginBottom: 8, lineHeight: 1.4 }}>
          You've seen every destination this round.
        </div>
        <div style={{ fontSize: '0.8125rem', color: c.dim, lineHeight: 1.6, marginBottom: 28, maxWidth: 420 }}>
          {savedCount > 0
            ? `${savedCount} saved to your trips. Regenerate to shuffle the deck and surface them in a new order.`
            : 'Nothing saved this round. Regenerate the deck and try a slower second pass.'}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {savedCount > 0 && (
            <button
              onClick={() => router.push('/trips')}
              style={{ background: c.fg, border: 'none', color: c.bg, fontFamily: MONO, fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 22px', cursor: 'pointer' }}
            >
              View trips ({savedCount})
            </button>
          )}
          <button
            onClick={() => clearSwipes()}
            style={{ background: 'none', border: `1px solid ${c.fg}`, color: c.fg, fontFamily: MONO, fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 22px', cursor: 'pointer' }}
          >
            ↻ Regenerate deck
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-[480px] md:max-w-[680px] lg:max-w-[760px]"
      style={{ position: 'relative', padding: '24px 0 40px', minHeight: 600 }}
    >
      {/* progress count */}
      <div style={{ textAlign: 'center', fontSize: '0.5625rem', color: c.faint, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>
        round {discoverRound + 1} · {queue.length} left · {savedCount} saved
      </div>

      <div style={{ position: 'relative' }}>
        {/* Background card 2 (deepest) */}
        {after && (
          <motion.div
            key={`bg2-${after.id}`}
            initial={{ scale: 0.92, y: 24, opacity: 0.4 }}
            animate={{ scale: 0.92, y: 24, opacity: 0.4 }}
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              border: `1px solid ${c.ghost}`, background: c.bg,
              transformOrigin: 'top center',
            }}
          />
        )}

        {/* Background card 1 */}
        {next && (
          <motion.div
            key={`bg1-${next.id}`}
            initial={{ scale: 0.96, y: 12, opacity: 0.7 }}
            animate={{ scale: 0.96, y: 12, opacity: 0.7 }}
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              border: `1px solid ${c.ghost}`, background: c.bg,
              transformOrigin: 'top center',
            }}
          />
        )}

        {/* Top draggable card */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={top.id}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ position: 'relative', zIndex: 2 }}
          >
            <SwipeCard
              dest={top}
              passport={passport}
              onSwipe={handleSwipe}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* swipe instructions */}
      <div style={{ textAlign: 'center', marginTop: 18, fontSize: '0.625rem', color: c.faint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        ← skip · save →
      </div>
    </div>
  );
}
