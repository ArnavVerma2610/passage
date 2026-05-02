'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePassageStore } from '@/lib/store';

const STEPS: ReadonlyArray<readonly [string, string]> = [
  ['Save a destination', 'Hit + on any destination in Discover. That signals your intent.'],
  ['Get matched', 'We find travelers from different passports aiming at the same place.'],
  ['Group chat unlocks', 'A shared thread opens — compare visa strategies, coordinate timing.'],
  [
    'The crossing is the point',
    'The conversation is between people navigating different bureaucracies toward the same place.',
  ],
];

export default function ChatPage() {
  const router = useRouter();
  const _hasHydrated = usePassageStore(s => s._hasHydrated);
  const passport = usePassageStore(s => s.passport);
  const saved = usePassageStore(s => s.swipedDestinations).filter(s => s.dir === 'right');

  useEffect(() => {
    if (_hasHydrated && !passport) router.replace('/');
  }, [_hasHydrated, passport, router]);

  if (!_hasHydrated || !passport) return null;

  return (
    <div className="min-h-screen pb-20 text-sm">
      <div className="border-b border-ghost px-6 pb-5 pt-6">
        <div className="mb-1 text-[0.5625rem] uppercase tracking-[0.18em] text-faint">Chat</div>
        <div className="text-base text-fg">Group matching</div>
        <div className="mt-1 text-[0.6875rem] text-faint">
          Find travelers attempting the same crossing from a different passport
        </div>
      </div>

      <div className="max-w-[560px] px-6 py-10">
        <div className="mb-8">
          <div className="mb-3.5 text-[0.5625rem] uppercase tracking-[0.12em] text-faint">
            How it works
          </div>
          {STEPS.map(([title, desc], i) => (
            <div key={i} className="mb-5 flex gap-4">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-ghost text-[0.5625rem] text-faint">
                {i + 1}
              </div>
              <div>
                <div className="mb-1 text-sm text-sub">{title}</div>
                <div className="text-[0.8125rem] leading-relaxed text-dim">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {saved.length === 0 ? (
          <div className="border border-ghost bg-surface p-5">
            <div className="mb-4 text-[0.8125rem] leading-relaxed text-dim">
              Save at least one destination to enable group matching.
            </div>
            <button
              type="button"
              onClick={() => router.push('/discover')}
              className="cursor-pointer border border-ghost bg-transparent px-5 py-[11px] font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-dim"
            >
              Go to Discover →
            </button>
          </div>
        ) : (
          <div className="border border-ghost p-5">
            <div className="mb-2.5 text-[0.625rem] uppercase tracking-[0.1em] text-faint">
              Matching in progress
            </div>
            <div className="text-[0.8125rem] leading-relaxed text-dim">
              You have {saved.length} destination{saved.length > 1 ? 's' : ''} queued for matching.
              Group chats will appear here when travelers from compatible passports save the same
              destinations.
            </div>
            <div className="mt-3.5 text-[0.625rem] italic text-faint">
              This feature is in development. You&apos;ll get a notification when a match is found.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
