'use client';

import { useRouter } from 'next/navigation';
import { usePassageStore } from '@/lib/store';
import { computeAmpScore, effectiveVisaProb, getTier } from '@/lib/amp';
import type { Destination } from '@/lib/types';

interface DestCardProps {
  dest: Destination;
  passport: string;
}

export default function DestCard({ dest, passport }: DestCardProps) {
  const router = useRouter();
  const swipedDestinations = usePassageStore(s => s.swipedDestinations);
  const addSwipedDestination = usePassageStore(s => s.addSwipedDestination);
  const removeSwipedDestination = usePassageStore(s => s.removeSwipedDestination);

  const amp = usePassageStore(s => s.amp);
  const tier = getTier(computeAmpScore(amp));
  const baseProb = dest.visaProb[passport] || 50;
  const prob = effectiveVisaProb(baseProb, tier);
  const saved = swipedDestinations.some(e => e.id === dest.id && e.dir === 'right');

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) removeSwipedDestination(dest.id);
    else addSwipedDestination(dest.id, 'right');
  };

  const probClass =
    prob > 80
      ? 'border-ghost text-sub'
      : prob > 50
        ? 'border-warn-border text-warn'
        : 'border-danger-border text-danger';

  return (
    <div
      onClick={() => router.push(`/trip/${dest.id}`)}
      className="relative cursor-pointer border-b border-r border-ghost bg-transparent transition-colors hover:bg-surface-2"
    >
      <button
        type="button"
        onClick={toggleSave}
        title={saved ? 'Remove from trips' : 'Save to trips'}
        className={`absolute right-3.5 top-3.5 z-[2] flex h-[26px] w-[26px] cursor-pointer items-center justify-center border font-mono text-[0.625rem] transition-all ${
          saved ? 'border-fg bg-fg text-bg' : 'border-ghost bg-transparent text-faint'
        }`}
      >
        {saved ? '✓' : '+'}
      </button>

      <div className="px-5 pb-[18px] pt-5">
        <div className="mb-2.5 font-mono text-[0.5625rem] tracking-[0.14em] text-faint">
          {dest.coords}
        </div>

        <div className="mb-0.5 pr-9 font-mono text-xl leading-tight">{dest.name}</div>
        <div className="mb-0.5 text-[0.8125rem] text-dim">{dest.country}</div>
        <div className="mb-4 text-[0.6875rem] text-faint">{dest.region}</div>

        <div className="mb-[18px] flex flex-wrap gap-1.5">
          <span
            className={`border px-2 py-[3px] font-mono text-[0.5625rem] tracking-[0.08em] ${probClass}`}
          >
            {prob}% VISA
          </span>
          <span className="border border-ghost px-2 py-[3px] font-mono text-[0.5625rem] tracking-[0.06em] text-faint">
            {dest.bestMonths}
          </span>
          <span className="border border-ghost px-2 py-[3px] font-mono text-[0.5625rem] tracking-[0.06em] text-faint">
            FRICTION {dest.frictionLevel}
          </span>
        </div>

        <div className="border-l-2 border-ghost pl-3 text-[0.8125rem] italic leading-snug text-dim">
          &ldquo;{dest.voiceNote}&rdquo;
        </div>
      </div>

      <div className="h-0.5 bg-ghost">
        <div className="h-0.5 bg-faint" style={{ width: `${dest.frictionLevel}%` }} />
      </div>
    </div>
  );
}
